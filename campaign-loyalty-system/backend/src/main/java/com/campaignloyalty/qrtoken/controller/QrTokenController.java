package com.campaignloyalty.qrtoken.controller;

import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.service.QrTokenService;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/qr-tokens")
@AllArgsConstructor
public class QrTokenController {

    private final QrTokenService qrTokenService;

    @PostMapping("/generate/{hotelId}")
    public ResponseEntity<QrToken> generateToken(@PathVariable Long hotelId) {
        QrToken qrToken = qrTokenService.generateToken(hotelId);
        return ResponseEntity.ok(qrToken);
    }
}
