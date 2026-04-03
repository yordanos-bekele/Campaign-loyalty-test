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

        assertFalse(response.isSuccess());
        assertFalse(response.isRewardEarned());

        ArgumentCaptor<ScanHistory> historyCaptor = ArgumentCaptor.forClass(ScanHistory.class);
        verify(scanHistoryRepository).save(historyCaptor.capture());
        ScanHistory savedHistory = historyCaptor.getValue();
        assertFalse(savedHistory.isValid());
        assertNull(savedHistory.getCustomerId());
        assertNull(savedHistory.getHotelId());
    }

    @Test
    void rejectsTooFrequentScanWithoutUpdatingProgress() {
        Customer customer = createCustomer(10L);
        QrToken qrToken = createToken(99L, LocalDateTime.now().plusMinutes(5));
        CustomerHotelProgress progress = createProgress(customer.getId(), qrToken.getHotelId(), 2, 1, LocalDateTime.now().minusMinutes(5));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.findOrCreateByDeviceId("device-1")).thenReturn(customer);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), qrToken.getHotelId())).thenReturn(progress);

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertFalse(response.isSuccess());
        verify(customerHotelProgressRepository, never()).save(any(CustomerHotelProgress.class));
        verify(rewardService, never()).createReward(any(), any());
    }

    @Test
    void rejectsDailyLimitAfterResetCheck() {
        Customer customer = createCustomer(10L);
        QrToken qrToken = createToken(99L, LocalDateTime.now().plusMinutes(5));
        CustomerHotelProgress progress = createProgress(customer.getId(), qrToken.getHotelId(), 7, 3, LocalDateTime.now().minusHours(1));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.findOrCreateByDeviceId("device-1")).thenReturn(customer);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), qrToken.getHotelId())).thenReturn(progress);

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertFalse(response.isSuccess());
        assertFalse(response.isRewardEarned());
        verify(customerHotelProgressRepository, never()).save(any(CustomerHotelProgress.class));
    }

    @Test
    void awardsRewardAndResetsProgressAtTenScans() {
        Customer customer = createCustomer(10L);
        QrToken qrToken = createToken(99L, LocalDateTime.now().plusMinutes(5));
        CustomerHotelProgress progress = createProgress(customer.getId(), qrToken.getHotelId(), 9, 0, LocalDateTime.now().minusMinutes(30));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.findOrCreateByDeviceId("device-1")).thenReturn(customer);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), qrToken.getHotelId())).thenReturn(progress);
        when(customerHotelProgressRepository.save(any(CustomerHotelProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertTrue(response.isSuccess());
        assertTrue(response.isRewardEarned());
        verify(customerHotelProgressRepository, times(2)).save(progress);
        verify(rewardService).createReward(customer.getId(), qrToken.getHotelId());

        ArgumentCaptor<ScanHistory> historyCaptor = ArgumentCaptor.forClass(ScanHistory.class);
        verify(scanHistoryRepository).save(historyCaptor.capture());
        assertTrue(historyCaptor.getValue().isValid());
        assertNull(historyCaptor.getValue().getRejectReason());
    }

    @Test
    void createsNewProgressForFirstSuccessfulScan() {
        Customer customer = createCustomer(10L);
        QrToken qrToken = createToken(99L, LocalDateTime.now().plusMinutes(5));

        when(qrTokenRepository.findByToken("active-token")).thenReturn(qrToken);
        when(hotelRepository.findById(qrToken.getHotelId())).thenReturn(Optional.of(new Hotel()));
        when(customerService.findOrCreateByDeviceId("device-1")).thenReturn(customer);
        when(customerHotelProgressRepository.findByCustomerIdAndHotelId(customer.getId(), qrToken.getHotelId())).thenReturn(null);
        when(customerHotelProgressRepository.save(any(CustomerHotelProgress.class))).thenAnswer(invocation -> invocation.getArgument(0));

        ScanResponse response = scanService.scan("device-1", "active-token", "127.0.0.1", "JUnit");

        assertTrue(response.isSuccess());
        assertFalse(response.isRewardEarned());

        ArgumentCaptor<CustomerHotelProgress> progressCaptor = ArgumentCaptor.forClass(CustomerHotelProgress.class);
        verify(customerHotelProgressRepository).save(progressCaptor.capture());
        CustomerHotelProgress savedProgress = progressCaptor.getValue();
        assertTrue(savedProgress.getScanCount() == 1);
        assertTrue(savedProgress.getDailyScanCount() == 1);
        assertTrue(savedProgress.getCustomerId().equals(customer.getId()));
        assertTrue(savedProgress.getHotelId().equals(qrToken.getHotelId()));
    }

    private Customer createCustomer(Long id) {
        Customer customer = new Customer();
        customer.setId(id);
        customer.setDeviceId("device-1");
        return customer;
    }

    private QrToken createToken(Long hotelId, LocalDateTime expiresAt) {
        QrToken qrToken = new QrToken();
        qrToken.setHotelId(hotelId);
        qrToken.setToken("active-token");
        qrToken.setExpiresAt(expiresAt);
        return qrToken;
    }

    private CustomerHotelProgress createProgress(Long customerId, Long hotelId, int scanCount, int dailyScanCount, LocalDateTime lastScanAt) {
        CustomerHotelProgress progress = new CustomerHotelProgress();
        progress.setCustomerId(customerId);
        progress.setHotelId(hotelId);
        progress.setScanCount(scanCount);
        progress.setDailyScanCount(dailyScanCount);
        progress.setLastScanAt(lastScanAt);
        return progress;
    }
}
