package com.campaignloyalty.scan.service;

import com.campaignloyalty.scan.dto.ScanResponse;
import com.campaignloyalty.scan.entity.RejectionReason;
import com.campaignloyalty.scan.entity.ScanHistory;
import com.campaignloyalty.scan.repository.ScanHistoryRepository;

import lombok.extern.slf4j.Slf4j;

import com.campaignloyalty.customer.entity.Customer;
import com.campaignloyalty.customer.entity.CustomerHotelProgress;
import com.campaignloyalty.customer.service.CustomerService;
import com.campaignloyalty.customer.repository.CustomerHotelProgressRepository;
import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.repository.HotelRepository;
import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.repository.QrTokenRepository;
import com.campaignloyalty.reward.entity.Reward;
import com.campaignloyalty.reward.service.RewardService;
import jakarta.transaction.Transactional;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@Transactional
@Slf4j
public class ScanService {

    @Value("${campaign.time-gap-minutes:60}")
    private int minScanGapMinutes = 60;

    @Value("${campaign.daily-scan-limit:3}")
    private int maxDailyValidScans = 3;

    @Value("${campaign.reward-threshold:10}")
    private int rewardThreshold = 10;

    private final QrTokenRepository qrTokenRepository;

    private final HotelRepository hotelRepository;

    private final CustomerService customerService;

    private final CustomerHotelProgressRepository customerHotelProgressRepository;

    private final ScanHistoryRepository scanHistoryRepository;

    private final RewardService rewardService;

    public ScanService(
            QrTokenRepository qrTokenRepository,
            HotelRepository hotelRepository,
            CustomerService customerService,
            CustomerHotelProgressRepository customerHotelProgressRepository,
            ScanHistoryRepository scanHistoryRepository,
            RewardService rewardService) {
        this.qrTokenRepository = qrTokenRepository;
        this.hotelRepository = hotelRepository;
        this.customerService = customerService;
        this.customerHotelProgressRepository = customerHotelProgressRepository;
        this.scanHistoryRepository = scanHistoryRepository;
        this.rewardService = rewardService;
    }

    public ScanResponse scan(String deviceId, String token, String ip, String userAgent) {
        int effectiveMinScanGapMinutes = Math.max(0, minScanGapMinutes);
        int effectiveMaxDailyValidScans = Math.max(0, maxDailyValidScans);
        int effectiveRewardThreshold = rewardThreshold < 1 ? 10 : rewardThreshold;

        log.info("Processing scan request deviceId={} token={} ip={}", deviceId, token, ip);
        if (isBlank(token)) {
            return rejectForInvalidToken(token, ip, userAgent, effectiveRewardThreshold);
        }

        LocalDateTime now = LocalDateTime.now();
        QrToken qrToken = qrTokenRepository.findByToken(token);
        // Treat tokens as valid when expiresAt is equal to "now" to avoid edge-case
        // rejections
        // during the exact expiry boundary (common on slow mobile handoffs).
        if (qrToken == null || qrToken.getExpiresAt() == null || qrToken.getExpiresAt().isBefore(now)) {
            return rejectForInvalidToken(token, ip, userAgent, effectiveRewardThreshold);
        }

        Integer hotelId = qrToken.getHotelId();
        Hotel hotel = hotelRepository.findById(hotelId).orElse(null);
        if (hotel == null) {
            return rejectForInvalidToken(token, ip, userAgent, effectiveRewardThreshold);
        }

        if (isBlank(deviceId)) {
            return rejectForInvalidToken(token, ip, userAgent, effectiveRewardThreshold);
        }

        Customer customer = customerService.getRegisteredCustomerByDeviceId(deviceId);
        if (customer == null) {
            return rejectForUnregisteredDevice(hotelId, token, ip, userAgent, effectiveRewardThreshold);
        }
        log.debug("Resolved scan customerId={} hotelId={}", customer.getId(), hotelId);

        CustomerHotelProgress progress = customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(),
                hotelId);
        if (progress == null) {
            progress = createProgress(customer.getId(), hotelId);
        }

        LocalDate today = LocalDate.now();
        if (progress.getLastScanAt() == null || !progress.getLastScanAt().toLocalDate().equals(today)) {
            progress.setDailyScanCount(0);
        }

        if (progress.getPendingRewardId() != null) {
            return requireRewardConfirmation(customer.getId(), hotelId, progress.getPendingRewardId(), token, ip,
                    userAgent, progress, effectiveRewardThreshold);
        }

        if (progress.getLastScanAt() != null) {
            LocalDateTime nextAllowedScanAt = progress.getLastScanAt().plusMinutes(effectiveMinScanGapMinutes);
            if (now.isBefore(nextAllowedScanAt)) {
                log.warn("Scan rejected due to minimum time gap customerId={} hotelId={} nextAllowedScanAt={}",
                        customer.getId(), hotelId, nextAllowedScanAt);
                return rejectScan(
                        customer.getId(),
                        hotelId,
                        token,
                        ip,
                        userAgent,
                        progress,
                        RejectionReason.MIN_TIME_NOT_REACHED,
                        nextAllowedScanAt);
            }
        }

        if (progress.getDailyScanCount() >= effectiveMaxDailyValidScans) {
            log.warn("Scan rejected due to daily limit customerId={} hotelId={} dailyScanCount={}",
                    customer.getId(), hotelId, progress.getDailyScanCount());
            return rejectScan(
                    customer.getId(),
                    hotelId,
                    token,
                    ip,
                    userAgent,
                    progress,
                    RejectionReason.DAILY_LIMIT_REACHED,
                    null);
        }

        progress.setScanCount(progress.getScanCount() + 1);
        progress.setDailyScanCount(progress.getDailyScanCount() + 1);
        progress.setLastScanAt(now);
        customerHotelProgressRepository.save(progress);
        log.info("Valid scan accepted customerId={} hotelId={} currentCount={} dailyScanCount={}",
                customer.getId(), hotelId, progress.getScanCount(), progress.getDailyScanCount());

        int currentCount = progress.getScanCount();
        if (progress.getScanCount() >= effectiveRewardThreshold) {
            Reward reward = rewardService.createPendingReward(customer.getId(), hotelId);
            progress.setPendingRewardId(reward.getId());
            customerHotelProgressRepository.save(progress);
            logScanHistory(customer.getId(), hotelId, token, ip, userAgent, true, null, false);
            log.info("Reward pending confirmation customerId={} hotelId={} rewardId={}", customer.getId(), hotelId,
                    reward.getId());
            return new ScanResponse(
                    "confirmation_required",
                    currentCount,
                    0,
                    null,
                    reward.getId(),
                    null,
                    "Confirm to claim your free beer reward.");
        }

        logScanHistory(customer.getId(), hotelId, token, ip, userAgent, true, null, false);
        log.debug("Scan completed without reward customerId={} hotelId={} remainingToReward={}",
                customer.getId(), hotelId, effectiveRewardThreshold - currentCount);
        return new ScanResponse(
                "success",
                currentCount,
                effectiveRewardThreshold - currentCount,
                null,
                null,
                null,
                "Scan successful");
    }

    public ScanResponse confirmReward(String deviceId, Integer rewardId, String ip, String userAgent) {
        int effectiveRewardThreshold = rewardThreshold < 1 ? 10 : rewardThreshold;
        if (isBlank(deviceId)) {
            log.warn("device_id cookie or X-Device-Id header is required");
            throw new IllegalArgumentException("device_id cookie or X-Device-Id header is required");
        }
        if (rewardId == null) {
            throw new IllegalArgumentException("reward id is required");
        }

        Customer customer = customerService.getRegisteredCustomerByDeviceId(deviceId);
        if (customer == null) {
            return new ScanResponse(
                    "rejected",
                    0,
                    effectiveRewardThreshold,
                    RejectionReason.UNREGISTERED_DEVICE.name(),
                    null,
                    null,
                    "Please register your username and phone number before confirming.");
        }

        Reward reward = rewardService.findReward(rewardId);
        if (reward == null) {
            log.warn("reward not found for rewardId={}", rewardId);
            throw new IllegalArgumentException("reward not found");
        }

        Integer hotelId = reward.getHotelId();
        CustomerHotelProgress progress = customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(),
                hotelId);
        if (progress == null || progress.getPendingRewardId() == null
                || !progress.getPendingRewardId().equals(rewardId)) {
            throw new IllegalArgumentException("no pending reward confirmation found for this device");
        }

        rewardService.confirmReward(rewardId, customer.getId(), hotelId);

        progress.setScanCount(0);
        progress.setPendingRewardId(null);
        customerHotelProgressRepository.save(progress);
        log.info("Reward confirmed via user action customerId={} hotelId={} rewardId={}", customer.getId(), hotelId,
                rewardId);

        return new ScanResponse(
                "reward_earned",
                0,
                effectiveRewardThreshold,
                null,
                rewardId,
                null,
                "Congratulations! You earned a free beer.");
    }

    private CustomerHotelProgress createProgress(Integer customerId, Integer hotelId) {
        CustomerHotelProgress progress = new CustomerHotelProgress();
        progress.setCustomerId(customerId);
        progress.setHotelId(hotelId);
        return progress;
    }

    private ScanResponse rejectForInvalidToken(String token, String ip, String userAgent,
            int effectiveRewardThreshold) {
        log.warn("Scan rejected due to invalid or expired token token={} ip={}", token, ip);
        logScanHistory(null, null, token, ip, userAgent, false, RejectionReason.INVALID_OR_EXPIRED_TOKEN, false);
        return new ScanResponse(
                "rejected",
                0,
                effectiveRewardThreshold,
                RejectionReason.INVALID_OR_EXPIRED_TOKEN.name(),
                null,
                null,
                null);
    }

    private ScanResponse rejectForUnregisteredDevice(
            Integer hotelId,
            String token,
            String ip,
            String userAgent,
            int effectiveRewardThreshold) {
        log.warn("Scan rejected due to unregistered device hotelId={} ip={}", hotelId, ip);
        logScanHistory(null, hotelId, token, ip, userAgent, false, RejectionReason.UNREGISTERED_DEVICE, false);
        return new ScanResponse(
                "rejected",
                0,
                effectiveRewardThreshold,
                RejectionReason.UNREGISTERED_DEVICE.name(),
                null,
                null,
                "Please register your username and phone number before scanning.");
    }

    private ScanResponse requireRewardConfirmation(
            Integer customerId,
            Integer hotelId,
            Integer rewardId,
            String token,
            String ip,
            String userAgent,
            CustomerHotelProgress progress,
            int effectiveRewardThreshold) {
        log.warn("Scan requires reward confirmation customerId={} hotelId={} rewardId={}", customerId, hotelId,
                rewardId);
        logScanHistory(customerId, hotelId, token, ip, userAgent, false, RejectionReason.REWARD_CONFIRMATION_REQUIRED,
                false);
        return new ScanResponse(
                "confirmation_required",
                progress.getScanCount(),
                0,
                RejectionReason.REWARD_CONFIRMATION_REQUIRED.name(),
                rewardId,
                null,
                "Confirm your reward to complete the 10th scan.");
    }

    private ScanResponse rejectScan(
            Integer customerId,
            Integer hotelId,
            String token,
            String ip,
            String userAgent,
            CustomerHotelProgress progress,
            RejectionReason rejectionReason,
            LocalDateTime nextAllowedScanAt) {
        int effectiveRewardThreshold = rewardThreshold < 1 ? 10 : rewardThreshold;
        boolean suspicious = isSuspiciousViolation(customerId, hotelId, rejectionReason);
        log.warn("Scan rejected customerId={} hotelId={} reason={} suspicious={} nextAllowedScanAt={}",
                customerId, hotelId, rejectionReason, suspicious, nextAllowedScanAt);
        logScanHistory(customerId, hotelId, token, ip, userAgent, false, rejectionReason, suspicious);
        return new ScanResponse(
                "rejected",
                progress.getScanCount(),
                effectiveRewardThreshold - progress.getScanCount(),
                rejectionReason.name(),
                null,
                nextAllowedScanAt,
                null);
    }

    private boolean isSuspiciousViolation(Integer customerId, Integer hotelId, RejectionReason rejectionReason) {
        LocalDateTime now = LocalDateTime.now();

        // We flag as suspicious when this rejection becomes the 3rd failed attempt
        // inside 10 minutes.
        long rejectedInTenMinutes = scanHistoryRepository.countByCustomerIdAndHotelIdAndValidFalseAndScannedAtAfter(
                customerId,
                hotelId,
                now.minusMinutes(10));
        if (rejectedInTenMinutes >= 2) {
            log.warn(
                    "Suspicious scan pattern detected by 10-minute rejection threshold customerId={} hotelId={} rejectedCount={}",
                    customerId, hotelId, rejectedInTenMinutes + 1);
            return true;
        }

        // "Repeated violations within the same hour" is interpreted as at least one
        // prior
        // rejection with the same reason for the same customer and hotel in the last
        // hour.
        long sameReasonInHour = scanHistoryRepository
                .countByCustomerIdAndHotelIdAndValidFalseAndRejectionReasonAndScannedAtAfter(
                        customerId,
                        hotelId,
                        rejectionReason,
                        now.minusHours(1));
        if (sameReasonInHour >= 1) {
            log.warn(
                    "Suspicious scan pattern detected by repeated hourly violations customerId={} hotelId={} reason={} priorCount={}",
                    customerId, hotelId, rejectionReason, sameReasonInHour);
        }
        return sameReasonInHour >= 1;
    }

    private void logScanHistory(
            Integer customerId,
            Integer hotelId,
            String qrToken,
            String ip,
            String userAgent,
            boolean valid,
            RejectionReason rejectionReason,
            boolean suspicious) {
        ScanHistory scanHistory = new ScanHistory();
        scanHistory.setCustomerId(customerId);
        scanHistory.setHotelId(hotelId);
        scanHistory.setQrToken(qrToken);
        scanHistory.setIpAddress(ip);
        scanHistory.setUserAgent(userAgent);
        scanHistory.setValid(valid);
        scanHistory.setRejectionReason(rejectionReason);
        scanHistory.setSuspicious(suspicious);
        scanHistoryRepository.save(scanHistory);
        log.debug("Scan history saved customerId={} hotelId={} valid={} rejectionReason={} suspicious={}",
                customerId, hotelId, valid, rejectionReason, suspicious);
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
    }
}
