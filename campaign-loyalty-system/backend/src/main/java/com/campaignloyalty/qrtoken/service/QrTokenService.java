package com.campaignloyalty.qrtoken.service;

import com.campaignloyalty.hotel.repository.HotelRepository;
import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.repository.QrTokenRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@AllArgsConstructor
public class QrTokenService {

    private final HotelRepository hotelRepository;

    private final QrTokenRepository qrTokenRepository;

    public QrToken generateToken(Integer hotelId) {
        validateHotelId(hotelId);

        LocalDateTime now = LocalDateTime.now();
        QrToken qrToken = new QrToken();
        qrToken.setHotelId(hotelId);
        qrToken.setToken(UUID.randomUUID().toString());
        qrToken.setCreatedAt(now);
        qrToken.setExpiresAt(now.plusMinutes(2));
        return qrTokenRepository.save(qrToken);
    }

    public QrToken findByToken(String token) {
        return qrTokenRepository.findByToken(token);
    }

    private void validateHotelId(Integer hotelId) {
        if (hotelId == null || hotelId <= 0) {
            throw new IllegalArgumentException("hotelId must be greater than 0");
        }
        if (!hotelRepository.existsById(hotelId)) {
            throw new IllegalArgumentException("Hotel not found");
        }
    }
}
