package com.campaignloyalty.auth.service;

import com.campaignloyalty.auth.dto.AdminLoginRequest;
import com.campaignloyalty.auth.dto.AuthResponse;
import com.campaignloyalty.auth.dto.HotelLoginRequest;
import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.service.HotelService;
import jakarta.servlet.http.HttpSession;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private static final String SESSION_ROLE = "campaign_role";
    private static final String SESSION_HOTEL_ID = "campaign_hotel_id";
    private static final String SESSION_DISPLAY_NAME = "campaign_display_name";

    private final HotelService hotelService;
    private final String adminUsername;
    private final String adminPassword;

    public AuthService(
            HotelService hotelService,
            @Value("${campaign.admin.username}") String adminUsername,
            @Value("${campaign.admin.password}") String adminPassword) {
        this.hotelService = hotelService;
        this.adminUsername = adminUsername;
        this.adminPassword = adminPassword;
    }

    public AuthResponse loginHotel(HotelLoginRequest request, HttpSession session) {
        Hotel hotel = hotelService.authenticate(request.getHotelName(), request.getPassword());
        session.setAttribute(SESSION_ROLE, "hotel");
        session.setAttribute(SESSION_HOTEL_ID, hotel.getId());
        session.setAttribute(SESSION_DISPLAY_NAME, hotel.getName());
        return new AuthResponse("hotel", hotel.getId(), hotel.getName());
    }

    public AuthResponse loginAdmin(AdminLoginRequest request, HttpSession session) {
        if (!adminUsername.equals(request.getUsername()) || !adminPassword.equals(request.getPassword())) {
            throw new IllegalArgumentException("Invalid admin username or password");
        }
        session.setAttribute(SESSION_ROLE, "admin");
        session.removeAttribute(SESSION_HOTEL_ID);
        session.setAttribute(SESSION_DISPLAY_NAME, adminUsername);
        return new AuthResponse("admin", null, adminUsername);
    }

    public AuthResponse getSessionUser(HttpSession session) {
        String role = (String) session.getAttribute(SESSION_ROLE);
        if (role == null) {
            return null;
        }
        return new AuthResponse(
                role,
                (Integer) session.getAttribute(SESSION_HOTEL_ID),
                (String) session.getAttribute(SESSION_DISPLAY_NAME));
    }

    public void logout(HttpSession session) {
        session.invalidate();
    }

    public SessionHotel requireHotel(HttpSession session) {
        String role = requireRole(session);
        if (!"hotel".equals(role)) {
            throw new IllegalArgumentException("Hotel login is required");
        }
        Integer hotelId = (Integer) session.getAttribute(SESSION_HOTEL_ID);
        String displayName = (String) session.getAttribute(SESSION_DISPLAY_NAME);
        return new SessionHotel(hotelId, displayName);
    }

    public void requireAdmin(HttpSession session) {
        String role = requireRole(session);
        if (!"admin".equals(role)) {
            throw new IllegalArgumentException("Admin login is required");
        }
    }

    public void assertCanViewHotel(HttpSession session, Integer hotelId) {
        String role = requireRole(session);
        if ("admin".equals(role)) {
            return;
        }
        if (!"hotel".equals(role)) {
            throw new IllegalArgumentException("Login is required");
        }
        Integer sessionHotelId = (Integer) session.getAttribute(SESSION_HOTEL_ID);
        if (!hotelId.equals(sessionHotelId)) {
            throw new IllegalArgumentException("You can only view your own hotel dashboard");
        }
    }

    private String requireRole(HttpSession session) {
        String role = (String) session.getAttribute(SESSION_ROLE);
        if (role == null) {
            throw new IllegalArgumentException("Login is required");
        }
        return role;
    }

    public record SessionHotel(Integer hotelId, String hotelName) {
    }
}
