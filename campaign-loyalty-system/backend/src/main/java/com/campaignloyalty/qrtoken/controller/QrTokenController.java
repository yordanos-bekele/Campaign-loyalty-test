package com.campaignloyalty.qrtoken.controller;

import com.campaignloyalty.auth.service.AuthService;
import com.campaignloyalty.qrtoken.entity.QrToken;
import com.campaignloyalty.qrtoken.service.QrTokenService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/qr-tokens")
@AllArgsConstructor
@Tag(name = "QR Tokens", description = "QR token generation endpoints")
public class QrTokenController {

    private final QrTokenService qrTokenService;
    private final AuthService authService;

    @PostMapping("/generate/{hotelId}")
    @Operation(
            summary = "Generate a QR token for a hotel",
            description = "Creates a short-lived QR token tied to a hotel.",
            responses = {
                    @ApiResponse(responseCode = "200", description = "Token generated"),
                    @ApiResponse(responseCode = "400", description = "Hotel does not exist or hotelId is invalid")
            }
    )
    public ResponseEntity<QrToken> generateToken(@PathVariable Integer hotelId, HttpSession session) {
        authService.requireAdmin(session);
        QrToken qrToken = qrTokenService.generateToken(hotelId);
        return ResponseEntity.ok(qrToken);
    }
}
