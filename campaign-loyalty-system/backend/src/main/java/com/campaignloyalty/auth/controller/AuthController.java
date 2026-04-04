package com.campaignloyalty.auth.controller;

import com.campaignloyalty.auth.dto.AdminLoginRequest;
import com.campaignloyalty.auth.dto.AuthResponse;
import com.campaignloyalty.auth.dto.HotelLoginRequest;
import com.campaignloyalty.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@AllArgsConstructor
@Tag(name = "Auth", description = "Hotel and admin login endpoints")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/hotel/login")
    @Operation(summary = "Hotel login", responses = {
            @ApiResponse(responseCode = "200", description = "Hotel login successful")
    })
    public ResponseEntity<AuthResponse> hotelLogin(@Valid @RequestBody HotelLoginRequest request, HttpSession session) {
        return ResponseEntity.ok(authService.loginHotel(request, session));
    }

    @PostMapping("/admin/login")
    @Operation(summary = "Admin login", responses = {
            @ApiResponse(responseCode = "200", description = "Admin login successful")
    })
    public ResponseEntity<AuthResponse> adminLogin(@Valid @RequestBody AdminLoginRequest request, HttpSession session) {
        return ResponseEntity.ok(authService.loginAdmin(request, session));
    }

    @GetMapping("/me")
    @Operation(summary = "Get current session")
    public ResponseEntity<AuthResponse> me(HttpSession session) {
        AuthResponse response = authService.getSessionUser(session);
        if (response == null) {
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    @Operation(summary = "Logout current session")
    public ResponseEntity<Void> logout(HttpSession session) {
        authService.logout(session);
        return ResponseEntity.noContent().build();
    }
}
