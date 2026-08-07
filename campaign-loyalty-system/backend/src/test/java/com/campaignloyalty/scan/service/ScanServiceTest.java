package com.campaignloyalty.scan.service;

import com.campaignloyalty.customer.entity.Customer;
import com.campaignloyalty.customer.entity.CustomerHotelProgress;
import com.campaignloyalty.customer.repository.CustomerHotelProgressRepository;
import com.campaignloyalty.customer.service.CustomerService;
import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.repository.HotelRepository;
import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.repository.QrTokenRepository;
import com.campaignloyalty.reward.service.RewardService;
import com.campaignloyalty.scan.dto.ScanResponse;
import com.campaignloyalty.scan.entity.RejectionReason;
import com.campaignloyalty.scan.entity.ScanHistory;
import com.campaignloyalty.scan.repository.ScanHistoryRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScanServiceTest {

    @Mock
    private QrTokenRepository qrTokenRepository;

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private CustomerService customerService;

    @Mock
    private CustomerHotelProgressRepository customerHotelProgressRepository;

    @Mock
    private ScanHistoryRepository scanHistoryRepository;

    @Mock
    private RewardService rewardService;

    @InjectMocks
    private ScanService scanService;

    @Test
    void rejectsInvalidTokenAndLogsFailedScan() {
        when(qrTokenRepository.findByToken("missing")).thenReturn(null);

        ScanResponse response = scanService.scan("device-1", "missing", "127.0.0.1", "JUnit");

        assertEquals("rejected", response.getStatus());
        assertEquals("INVALID_OR_EXPIRED_TOKEN", response.getReason());
        assertEquals(0, response.getCurrentCount());
        assertEquals(10, response.getRemainingToReward());

        ArgumentCaptor<ScanHistory> historyCaptor = ArgumentCaptor.forClass(ScanHistory.class);
        verify(scanHistoryRepository).save(historyCaptor.capture());
        ScanHistory savedHistory = historyCaptor.getValue();
        assertFalse(savedHistory.isValid());
        assertNull(savedHistory.getCustomerId());
        assertNull(savedHistory.getHotelId());
        assertEquals(RejectionReason.INVALID_OR_EXPIRED_TOKEN, savedHistory.getRejectionReason());
    }

    @Test
    void rejectsMissingTokenBeforeLookup() {
        ScanResponse response = scanService.scan("device-1", " ", "127.0.0.1", "JUnit");

        assertEquals("rejected", response.getStatus());
        assertEquals("INVALID_OR_EXPIRED_TOKEN", response.getReason());
        assertEquals(0, response.getCurrentCount());
        verify(qrTokenRepository, never()).findByToken(any());
    }

    @Test
    void rejectsMissingDeviceIdAfterTokenValidation() {
        QrToken qrToken = createToken(99, LocalDateTime.now().plusMinutes(5));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));

        ScanResponse response = scanService.scan(" ", "active-token", "127.0.0.1", "JUnit");

        assertEquals("rejected", response.getStatus());
        assertEquals("INVALID_OR_EXPIRED_TOKEN", response.getReason());
        assertEquals(0, response.getCurrentCount());
        verify(customerService, never()).getRegisteredCustomerByDeviceId(any());
    }

    @Test
    void rejectsUnregisteredDeviceWithoutCreatingProgress() {
        QrToken qrToken = createToken(99, LocalDateTime.now().plusMinutes(5));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.getRegisteredCustomerByDeviceId("device-1")).thenReturn(null);

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertEquals("rejected", response.getStatus());
        assertEquals("UNREGISTERED_DEVICE", response.getReason());
        assertEquals(0, response.getCurrentCount());
        assertEquals("Please register your username and phone number before scanning.", response.getMessage());

        verify(customerHotelProgressRepository, never()).findByCustomerIdAndHotelId(any(), any());
        verify(customerHotelProgressRepository, never()).save(any(CustomerHotelProgress.class));
        verify(rewardService, never()).createPendingReward(any(), any());

        ArgumentCaptor<ScanHistory> historyCaptor = ArgumentCaptor.forClass(ScanHistory.class);
        verify(scanHistoryRepository).save(historyCaptor.capture());
        ScanHistory savedHistory = historyCaptor.getValue();
        assertFalse(savedHistory.isValid());
        assertNull(savedHistory.getCustomerId());
        assertEquals(qrToken.getHotelId(), savedHistory.getHotelId());
        assertEquals(RejectionReason.UNREGISTERED_DEVICE, savedHistory.getRejectionReason());
    }

    @Test
    void rejectsTooFrequentScanWithoutUpdatingProgress() {
        Customer customer = createCustomer(10);
        QrToken qrToken = createToken(99, LocalDateTime.now().plusMinutes(5));
        CustomerHotelProgress progress = createProgress(customer.getId(), qrToken.getHotelId(), 2, 1,
                LocalDateTime.now().minusMinutes(5));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.getRegisteredCustomerByDeviceId("device-1")).thenReturn(customer);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), qrToken.getHotelId()))
                .thenReturn(progress);
        when(scanHistoryRepository.countByCustomerIdAndHotelIdAndValidFalseAndScannedAtAfter(eq(customer.getId()),
                eq(qrToken.getHotelId()), any(LocalDateTime.class))).thenReturn(0L);
        when(scanHistoryRepository.countByCustomerIdAndHotelIdAndValidFalseAndRejectionReasonAndScannedAtAfter(
                eq(customer.getId()), eq(qrToken.getHotelId()), eq(RejectionReason.MIN_TIME_NOT_REACHED),
                any(LocalDateTime.class))).thenReturn(0L);

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertEquals("rejected", response.getStatus());
        assertEquals("MIN_TIME_NOT_REACHED", response.getReason());
        assertEquals(2, response.getCurrentCount());
        assertEquals(8, response.getRemainingToReward());
        assertEquals(progress.getLastScanAt().plusMinutes(60), response.getNextAllowedScanAt());
        verify(customerHotelProgressRepository, never()).save(any(CustomerHotelProgress.class));
        verify(rewardService, never()).createPendingReward(any(), any());
    }

    @Test
    void rejectsDailyLimitAfterResetCheck() {
        Customer customer = createCustomer(10);
        QrToken qrToken = createToken(99, LocalDateTime.now().plusMinutes(5));
        CustomerHotelProgress progress = createProgress(customer.getId(), qrToken.getHotelId(), 7, 3,
                LocalDateTime.now().minusHours(1));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.getRegisteredCustomerByDeviceId("device-1")).thenReturn(customer);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), qrToken.getHotelId()))
                .thenReturn(progress);
        when(scanHistoryRepository.countByCustomerIdAndHotelIdAndValidFalseAndScannedAtAfter(eq(customer.getId()),
                eq(qrToken.getHotelId()), any(LocalDateTime.class))).thenReturn(0L);
        when(scanHistoryRepository.countByCustomerIdAndHotelIdAndValidFalseAndRejectionReasonAndScannedAtAfter(
                eq(customer.getId()), eq(qrToken.getHotelId()), eq(RejectionReason.DAILY_LIMIT_REACHED),
                any(LocalDateTime.class))).thenReturn(0L);

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertEquals("rejected", response.getStatus());
        assertEquals("DAILY_LIMIT_REACHED", response.getReason());
        assertEquals(7, response.getCurrentCount());
        assertEquals(3, response.getRemainingToReward());
        verify(customerHotelProgressRepository, never()).save(any(CustomerHotelProgress.class));
    }

    @Test
    void awardsRewardAndResetsProgressAtTenScans() {
        Customer customer = createCustomer(10);
        QrToken qrToken = createToken(99, LocalDateTime.now().plusMinutes(5));
        CustomerHotelProgress progress = createProgress(customer.getId(), qrToken.getHotelId(), 9, 0,
                LocalDateTime.now().minusHours(2));
        com.campaignloyalty.reward.entity.Reward reward = new com.campaignloyalty.reward.entity.Reward();
        reward.setId(123);

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.getRegisteredCustomerByDeviceId("device-1")).thenReturn(customer);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), qrToken.getHotelId()))
                .thenReturn(progress);
        when(customerHotelProgressRepository.save(any(CustomerHotelProgress.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(rewardService.createPendingReward(customer.getId(), qrToken.getHotelId())).thenReturn(reward);

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertEquals("confirmation_required", response.getStatus());
        assertEquals("Confirm to claim your free Marathon Klassics Cocktail reward.", response.getMessage());
        assertEquals(10, response.getCurrentCount());
        assertEquals(0, response.getRemainingToReward());
        assertEquals(123, response.getRewardId());
        verify(customerHotelProgressRepository, times(2)).save(progress);
        verify(rewardService).createPendingReward(customer.getId(), qrToken.getHotelId());

        ArgumentCaptor<ScanHistory> historyCaptor = ArgumentCaptor.forClass(ScanHistory.class);
        verify(scanHistoryRepository).save(historyCaptor.capture());
        assertTrue(historyCaptor.getValue().isValid());
        assertNull(historyCaptor.getValue().getRejectionReason());
    }

    @Test
    void confirmsPendingRewardAndResetsProgress() {
        Customer customer = createCustomer(10);
        com.campaignloyalty.reward.entity.Reward reward = new com.campaignloyalty.reward.entity.Reward();
        reward.setId(123);
        reward.setCustomerId(customer.getId());
        reward.setHotelId(99);

        CustomerHotelProgress progress = createProgress(customer.getId(), 99, 10, 1,
                LocalDateTime.now().minusMinutes(5));
        progress.setPendingRewardId(123);

        when(customerService.getRegisteredCustomerByDeviceId("device-1")).thenReturn(customer);
        when(rewardService.findReward(123)).thenReturn(reward);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), 99)).thenReturn(progress);
        when(customerHotelProgressRepository.save(any(CustomerHotelProgress.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ScanResponse response = scanService.confirmReward("device-1", 123, "127.0.0.1", "JUnit");

        assertEquals("reward_earned", response.getStatus());
        assertEquals("Congratulations! You earned a free Cocktail.", response.getMessage());
        assertEquals(0, response.getCurrentCount());
        assertEquals(10, response.getRemainingToReward());
        assertEquals(123, response.getRewardId());

        verify(rewardService).confirmReward(123, customer.getId(), 99);
        verify(customerHotelProgressRepository).save(progress);
        assertEquals(0, progress.getScanCount());
        assertNull(progress.getPendingRewardId());
    }

    @Test
    void createsNewProgressForFirstSuccessfulScan() {
        Customer customer = createCustomer(10);
        QrToken qrToken = createToken(99, LocalDateTime.now().plusMinutes(5));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.getRegisteredCustomerByDeviceId("device-1")).thenReturn(customer);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), qrToken.getHotelId()))
                .thenReturn(null);
        when(customerHotelProgressRepository.save(any(CustomerHotelProgress.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertEquals("success", response.getStatus());
        assertEquals("Scan successful", response.getMessage());
        assertEquals(1, response.getCurrentCount());
        assertEquals(9, response.getRemainingToReward());

        ArgumentCaptor<CustomerHotelProgress> progressCaptor = ArgumentCaptor.forClass(CustomerHotelProgress.class);
        verify(customerHotelProgressRepository).save(progressCaptor.capture());
        CustomerHotelProgress savedProgress = progressCaptor.getValue();
        assertTrue(savedProgress.getScanCount() == 1);
        assertTrue(savedProgress.getDailyScanCount() == 1);
        assertTrue(savedProgress.getCustomerId().equals(customer.getId()));
        assertTrue(savedProgress.getHotelId().equals(qrToken.getHotelId()));
    }

    @Test
    void flagsRejectedScanAsSuspiciousAfterRepeatedViolations() {
        Customer customer = createCustomer(10);
        QrToken qrToken = createToken(99, LocalDateTime.now().plusMinutes(5));
        CustomerHotelProgress progress = createProgress(customer.getId(), qrToken.getHotelId(), 2, 1,
                LocalDateTime.now().minusMinutes(10));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.getRegisteredCustomerByDeviceId("device-1")).thenReturn(customer);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), qrToken.getHotelId()))
                .thenReturn(progress);
        when(scanHistoryRepository.countByCustomerIdAndHotelIdAndValidFalseAndScannedAtAfter(eq(customer.getId()),
                eq(qrToken.getHotelId()), any(LocalDateTime.class))).thenReturn(2L);

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertEquals("rejected", response.getStatus());

        ArgumentCaptor<ScanHistory> historyCaptor = ArgumentCaptor.forClass(ScanHistory.class);
        verify(scanHistoryRepository).save(historyCaptor.capture());
        assertTrue(historyCaptor.getValue().isSuspicious());
        verify(scanHistoryRepository, never())
                .countByCustomerIdAndHotelIdAndValidFalseAndRejectionReasonAndScannedAtAfter(any(), any(), any(),
                        any());
    }

    private Customer createCustomer(Integer id) {
        Customer customer = new Customer();
        customer.setId(id);
        customer.setDeviceId("device-1");
        return customer;
    }

    private QrToken createToken(Integer hotelId, LocalDateTime expiresAt) {
        QrToken qrToken = new QrToken();
        qrToken.setHotelId(hotelId);
        qrToken.setToken("active-token");
        qrToken.setExpiresAt(expiresAt);
        return qrToken;
    }

    private CustomerHotelProgress createProgress(Integer customerId, Integer hotelId, int scanCount, int dailyScanCount,
            LocalDateTime lastScanAt) {
        CustomerHotelProgress progress = new CustomerHotelProgress();
        progress.setCustomerId(customerId);
        progress.setHotelId(hotelId);
        progress.setScanCount(scanCount);
        progress.setDailyScanCount(dailyScanCount);
        progress.setLastScanAt(lastScanAt);
        return progress;
    }
}
