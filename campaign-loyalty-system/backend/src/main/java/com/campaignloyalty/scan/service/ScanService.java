package com.campaignloyalty.scan.service;

import com.campaignloyalty.scan.dto.ScanResponse;
import com.campaignloyalty.scan.entity.RejectionReason;
import com.campaignloyalty.scan.entity.ScanHistory;
import com.campaignloyalty.scan.repository.ScanHistoryRepository;

import lombok.AllArgsConstructor;
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
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@AllArgsConstructor
@Transactional
@Slf4j
public class ScanService {

    @Value("${campaign.time-gap-minutes}")
    private final int MIN_SCAN_GAP_MINUTES;
    @Value("${campaign.daily-scan-limit}")
    private final int MAX_DAILY_VALID_SCANS;
    @Value("${campaign.reward-threshold}")
    private final int REWARD_THRESHOLD;

    private final QrTokenRepository qrTokenRepository;

    private final HotelRepository hotelRepository;

    private final CustomerService customerService;

    private final CustomerHotelProgressRepository customerHotelProgressRepository;

    private final ScanHistoryRepository scanHistoryRepository;

    private final RewardService rewardService;

    public ScanResponse scan(String deviceId, String token, String ip, String userAgent) {
        log.info("Processing scan request deviceId={} token={} ip={}", deviceId, token, ip);
        if (isBlank(token)) {
            return rejectForInvalidToken(token, ip, userAgent);
        }

        LocalDateTime now = LocalDateTime.now();
        QrToken qrToken = qrTokenRepository.findByToken(token);
        if (qrToken == null || qrToken.getExpiresAt() == null || !qrToken.getExpiresAt().isAfter(now)) {
            return rejectForInvalidToken(token, ip, userAgent);
        }

        Integer hotelId = qrToken.getHotelId();
        Hotel hotel = hotelRepository.findById(hotelId).orElse(null);
        if (hotel == null) {
            return rejectForInvalidToken(token, ip, userAgent);
        }

        if (isBlank(deviceId)) {
            return rejectForInvalidToken(token, ip, userAgent);
        }

        Customer customer = customerService.findOrCreateByDeviceId(deviceId);
        log.debug("Resolved scan customerId={} hotelId={}", customer.getId(), hotelId);

        CustomerHotelProgress progress = customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), hotelId);
        if (progress == null) {
            progress = createProgress(customer.getId(), hotelId);
        }

        LocalDate today = LocalDate.now();
        if (progress.getLastScanAt() == null || !progress.getLastScanAt().toLocalDate().equals(today)) {
            progress.setDailyScanCount(0);
        }

        if (progress.getLastScanAt() != null) {
            LocalDateTime nextAllowedScanAt = progress.getLastScanAt().plusMinutes(MIN_SCAN_GAP_MINUTES);
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

        if (progress.getDailyScanCount() >= MAX_DAILY_VALID_SCANS) {
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
        if (progress.getScanCount() >= REWARD_THRESHOLD) {
            progress.setScanCount(0);
            customerHotelProgressRepository.save(progress);
            Reward reward = rewardService.createReward(customer.getId(), hotelId);
            currentCount = 0;
            logScanHistory(customer.getId(), hotelId, token, ip, userAgent, true, null, false);
            log.info("Reward earned customerId={} hotelId={} rewardId={}", customer.getId(), hotelId, reward.getId());
            return new ScanResponse(
                    "reward_earned",
                    currentCount,
                    REWARD_THRESHOLD,
                    null,
                    reward.getId(),
                    null,
                    "Congratulations! You earned a free beer.");
        }

        logScanHistory(customer.getId(), hotelId, token, ip, userAgent, true, null, false);
        log.debug("Scan completed without reward customerId={} hotelId={} remainingToReward={}",
                customer.getId(), hotelId, REWARD_THRESHOLD - currentCount);
        return new ScanResponse(
                "success",
                currentCount,
                REWARD_THRESHOLD - currentCount,
                null,
                null,
                null,
                "Scan successful");
    }

    private CustomerHotelProgress createProgress(Integer customerId, Integer hotelId) {
        CustomerHotelProgress progress = new CustomerHotelProgress();
        progress.setCustomerId(customerId);
        progress.setHotelId(hotelId);
        return progress;
    }

    private ScanResponse rejectForInvalidToken(String token, String ip, String userAgent) {
        log.warn("Scan rejected due to invalid or expired token token={} ip={}", token, ip);
        logScanHistory(null, null, token, ip, userAgent, false, RejectionReason.INVALID_OR_EXPIRED_TOKEN, false);
        return new ScanResponse(
                "rejected",
                0,
                REWARD_THRESHOLD,
                RejectionReason.INVALID_OR_EXPIRED_TOKEN.name(),
                null,
                null,
                null);
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
        boolean suspicious = isSuspiciousViolation(customerId, hotelId, rejectionReason);
        log.warn("Scan rejected customerId={} hotelId={} reason={} suspicious={} nextAllowedScanAt={}",
                customerId, hotelId, rejectionReason, suspicious, nextAllowedScanAt);
        logScanHistory(customerId, hotelId, token, ip, userAgent, false, rejectionReason, suspicious);
        return new ScanResponse(
                "rejected",
                progress.getScanCount(),
                REWARD_THRESHOLD - progress.getScanCount(),
                rejectionReason.name(),
                null,
                nextAllowedScanAt,
                null);
    }

    private boolean isSuspiciousViolation(Integer customerId, Integer hotelId, RejectionReason rejectionReason) {
        LocalDateTime now = LocalDateTime.now();

        // We flag as suspicious when this rejection becomes the 3rd failed attempt inside 10 minutes.
        long rejectedInTenMinutes = scanHistoryRepository.countByCustomerIdAndHotelIdAndValidFalseAndScannedAtAfter(
                customerId,
                hotelId,
                now.minusMinutes(10));
        if (rejectedInTenMinutes >= 2) {
            log.warn("Suspicious scan pattern detected by 10-minute rejection threshold customerId={} hotelId={} rejectedCount={}",
                    customerId, hotelId, rejectedInTenMinutes + 1);
            return true;
        }

        // "Repeated violations within the same hour" is interpreted as at least one prior
        // rejection with the same reason for the same customer and hotel in the last hour.
        long sameReasonInHour = scanHistoryRepository.countByCustomerIdAndHotelIdAndValidFalseAndRejectionReasonAndScannedAtAfter(
                customerId,
                hotelId,
                rejectionReason,
                now.minusHours(1));
        if (sameReasonInHour >= 1) {
            log.warn("Suspicious scan pattern detected by repeated hourly violations customerId={} hotelId={} reason={} priorCount={}",
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
