package com.campaignloyalty.qrtoken.service;

import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.repository.QrTokenRepository;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@AllArgsConstructor
public class QrTokenService {

    private final QrTokenRepository qrTokenRepository;

    public QrToken generateToken(Long hotelId) {
        QrToken qrToken = new QrToken();
        qrToken.setHotelId(hotelId);
        qrToken.setToken(UUID.randomUUID().toString());
        qrToken.setCreatedAt(LocalDateTime.now());
        qrToken.setExpiresAt(LocalDateTime.now().plusMinutes(2));
        return qrTokenRepository.save(qrToken);
    }

    public QrToken findByToken(String token) {
        return qrTokenRepository.findByToken(token);
    }
}
