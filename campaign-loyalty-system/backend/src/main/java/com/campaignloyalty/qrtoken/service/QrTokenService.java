package com.campaignloyalty.qrtoken.service;

import com.campaignloyalty.hotel.repository.HotelRepository;
import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.repository.QrTokenRepository;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@AllArgsConstructor
@Slf4j
public class QrTokenService {

    private final HotelRepository hotelRepository;

    private final QrTokenRepository qrTokenRepository;

    public QrToken generateToken(Integer hotelId) {
        log.info("Generating QR token hotelId={}", hotelId);
        validateHotelId(hotelId);

        LocalDateTime now = LocalDateTime.now();
        QrToken qrToken = new QrToken();
        qrToken.setHotelId(hotelId);
        qrToken.setToken(UUID.randomUUID().toString());
        qrToken.setCreatedAt(now);
        qrToken.setExpiresAt(now.plusMinutes(2));
        QrToken savedToken = qrTokenRepository.save(qrToken);
        log.info("Generated QR token id={} hotelId={} expiresAt={}", savedToken.getId(), hotelId, savedToken.getExpiresAt());
        return savedToken;
    }

    public QrToken findByToken(String token) {
        log.debug("Looking up QR token token={}", token);
        QrToken qrToken = qrTokenRepository.findByToken(token);
        if (qrToken == null) {
            log.warn("QR token lookup returned no result token={}", token);
        }
        return qrToken;
    }

    private void validateHotelId(Integer hotelId) {
        if (hotelId == null || hotelId <= 0) {
            log.warn("QR token generation rejected invalid hotelId={}", hotelId);
            throw new IllegalArgumentException("hotelId must be greater than 0");
        }
        if (!hotelRepository.existsById(hotelId)) {
            log.warn("QR token generation rejected missing hotelId={}", hotelId);
            throw new IllegalArgumentException("Hotel not found");
        }
    }
}
