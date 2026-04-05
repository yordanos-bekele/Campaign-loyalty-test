package com.campaignloyalty.auth.controller;

import com.campaignloyalty.auth.dto.AdminLoginRequest;
import com.campaignloyalty.auth.dto.AuthResponse;
import com.campaignloyalty.auth.service.AuthService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/admin")
@AllArgsConstructor
@Tag(name = "Admin Auth", description = "Separate admin login entry point")
public class AdminAuthController {

    private final AuthService authService;

    @PostMapping("/login")
    @Operation(summary = "Admin login alias", responses = {
            @ApiResponse(responseCode = "200", description = "Admin login successful")
    })
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody AdminLoginRequest request, HttpSession session) {
        return ResponseEntity.ok(authService.loginAdmin(request, session));
    }
}
