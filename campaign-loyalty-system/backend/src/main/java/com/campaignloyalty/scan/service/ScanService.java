package com.campaignloyalty.scan.service;

import com.campaignloyalty.scan.dto.ScanResponse;
import com.campaignloyalty.scan.entity.ScanHistory;
import com.campaignloyalty.scan.repository.ScanHistoryRepository;

import lombok.AllArgsConstructor;

import com.campaignloyalty.customer.entity.Customer;
import com.campaignloyalty.customer.entity.CustomerHotelProgress;
import com.campaignloyalty.customer.service.CustomerService;
import com.campaignloyalty.customer.repository.CustomerHotelProgressRepository;
import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.repository.HotelRepository;
import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.repository.QrTokenRepository;
import com.campaignloyalty.reward.service.RewardService;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Service
@AllArgsConstructor
public class ScanService {

    
    private QrTokenRepository qrTokenRepository;

  
    private HotelRepository hotelRepository;

    private CustomerService customerService;

    private CustomerHotelProgressRepository customerHotelProgressRepository;

    private ScanHistoryRepository scanHistoryRepository;

    private RewardService rewardService;

    public ScanResponse scan(String deviceId, String token, String ip, String userAgent) {
        QrToken qrToken = qrTokenRepository.findByToken(token);
        if (qrToken == null || qrToken.getExpiresAt().isBefore(LocalDateTime.now())) {
            logScanHistory(null, null, token, ip, userAgent, false, "invalid token");
            return new ScanResponse(false, "Invalid QR token", false);
        }

        Long hotelId = qrToken.getHotelId();
        Hotel hotel = hotelRepository.findById(hotelId).orElse(null);
        if (hotel == null) {
            logScanHistory(null, hotelId, token, ip, userAgent, false, "hotel not found");
            return new ScanResponse(false, "Hotel not found", false);
        }

        Customer customer = customerService.findOrCreateByDeviceId(deviceId);

        CustomerHotelProgress progress = customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), hotelId);
        if (progress == null) {
            progress = new CustomerHotelProgress();
            progress.setCustomerId(customer.getId());
            progress.setHotelId(hotelId);
            progress.setScanCount(0);
            progress.setDailyScanCount(0);
            progress.setLastScanAt(null);
            progress.setUpdatedAt(LocalDateTime.now());
        }

        LocalDateTime now = LocalDateTime.now();
        LocalDate today = LocalDate.now();
        if (progress.getLastScanAt() == null || !progress.getLastScanAt().toLocalDate().equals(today)) {
            progress.setDailyScanCount(0);
        }

        if (progress.getLastScanAt() != null && progress.getLastScanAt().isAfter(now.minusMinutes(20))) {
            logScanHistory(customer.getId(), hotelId, token, ip, userAgent, false, "too frequent");
            return new ScanResponse(false, "Scans too frequent", false);
        }

        if (progress.getDailyScanCount() >= 3) {
            logScanHistory(customer.getId(), hotelId, token, ip, userAgent, false, "daily limit reached");
            return new ScanResponse(false, "Daily scan limit reached", false);
        }

        // accept
        progress.setScanCount(progress.getScanCount() + 1);
        progress.setDailyScanCount(progress.getDailyScanCount() + 1);
        progress.setLastScanAt(now);
        progress.setUpdatedAt(now);
        customerHotelProgressRepository.save(progress);

        boolean rewardEarned = false;
        if (progress.getScanCount() >= 10) {
            progress.setScanCount(0);
            customerHotelProgressRepository.save(progress);
            rewardService.createReward(customer.getId(), hotelId);
            rewardEarned = true;
        }

        logScanHistory(customer.getId(), hotelId, token, ip, userAgent, true, null);
        return new ScanResponse(true, "Scan successful", rewardEarned);
    }

    private void logScanHistory(Long customerId, Long hotelId, String qrToken, String ip, String userAgent, boolean valid, String rejectReason) {
        ScanHistory scanHistory = new ScanHistory();
        scanHistory.setCustomerId(customerId);
        scanHistory.setHotelId(hotelId);
        scanHistory.setQrToken(qrToken);
        scanHistory.setScannedAt(LocalDateTime.now());
        scanHistory.setIpAddress(ip);
        scanHistory.setUserAgent(userAgent);
        scanHistory.setValid(valid);
        scanHistory.setRejectReason(rejectReason);
        scanHistoryRepository.save(scanHistory);
    }
}