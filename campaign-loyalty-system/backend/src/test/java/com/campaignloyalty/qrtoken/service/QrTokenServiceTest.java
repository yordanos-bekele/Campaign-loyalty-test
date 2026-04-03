package com.campaignloyalty.qrtoken.service;

import com.campaignloyalty.hotel.repository.HotelRepository;
import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.repository.QrTokenRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class QrTokenServiceTest {

    @Mock
    private HotelRepository hotelRepository;

    @Mock
    private QrTokenRepository qrTokenRepository;

    @InjectMocks
    private QrTokenService qrTokenService;

    @Test
    void rejectsNonPositiveHotelId() {
        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> qrTokenService.generateToken(0L)
        );

        assertEquals("hotelId must be greater than 0", exception.getMessage());
        verify(hotelRepository, never()).existsById(any());
        verify(qrTokenRepository, never()).save(any());
    }

    @Test
    void rejectsUnknownHotel() {
        when(hotelRepository.existsById(99L)).thenReturn(false);

        IllegalArgumentException exception = assertThrows(
                IllegalArgumentException.class,
                () -> qrTokenService.generateToken(99L)
        );

        assertEquals("Hotel not found", exception.getMessage());
        verify(qrTokenRepository, never()).save(any());
    }

    @Test
    void generatesTokenForExistingHotel() {
        when(hotelRepository.existsById(99L)).thenReturn(true);
        when(qrTokenRepository.save(any(QrToken.class))).thenAnswer(invocation -> invocation.getArgument(0));

        QrToken qrToken = qrTokenService.generateToken(99L);

        assertEquals(99L, qrToken.getHotelId());
        assertNotNull(qrToken.getToken());
        assertNotNull(qrToken.getCreatedAt());
        assertNotNull(qrToken.getExpiresAt());
        verify(qrTokenRepository).save(any(QrToken.class));
    }
}
