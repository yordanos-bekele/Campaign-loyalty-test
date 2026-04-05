package com.campaignloyalty.auth.service;

import com.campaignloyalty.auth.dto.AdminLoginRequest;
import com.campaignloyalty.auth.dto.AuthResponse;
import com.campaignloyalty.auth.dto.HotelLoginRequest;
import com.campaignloyalty.hotel.entity.Hotel;
import com.campaignloyalty.hotel.service.HotelService;
import jakarta.servlet.http.HttpSession;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
@Slf4j
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
        log.info("Hotel login attempt hotelName={}", request.getHotelName());
        Hotel hotel = hotelService.authenticate(request.getHotelName(), request.getPassword());
        session.setAttribute(SESSION_ROLE, "hotel");
        session.setAttribute(SESSION_HOTEL_ID, hotel.getId());
        session.setAttribute(SESSION_DISPLAY_NAME, hotel.getName());
        log.info("Hotel login success hotelId={} hotelName={}", hotel.getId(), hotel.getName());
        return new AuthResponse("hotel", hotel.getId(), hotel.getName());
    }

    public AuthResponse loginAdmin(AdminLoginRequest request, HttpSession session) {
        log.info("Admin login attempt username={}", request.getUsername());
        if (!adminUsername.equals(request.getUsername()) || !adminPassword.equals(request.getPassword())) {
            log.warn("Admin login rejected username={}", request.getUsername());
            throw new IllegalArgumentException("Invalid admin username or password");
        }
        session.setAttribute(SESSION_ROLE, "admin");
        session.removeAttribute(SESSION_HOTEL_ID);
        session.setAttribute(SESSION_DISPLAY_NAME, adminUsername);
        log.info("Admin login success username={}", request.getUsername());
        return new AuthResponse("admin", null, adminUsername);
    }

    public AuthResponse getSessionUser(HttpSession session) {
        String role = (String) session.getAttribute(SESSION_ROLE);
        if (role == null) {
            log.debug("Session lookup found no authenticated user");
            return null;
        }
        log.debug("Session lookup resolved role={} hotelId={}", role, session.getAttribute(SESSION_HOTEL_ID));
        return new AuthResponse(
                role,
                (Integer) session.getAttribute(SESSION_HOTEL_ID),
                (String) session.getAttribute(SESSION_DISPLAY_NAME));
    }

    public void logout(HttpSession session) {
        log.info("Logout requested role={} hotelId={}", session.getAttribute(SESSION_ROLE), session.getAttribute(SESSION_HOTEL_ID));
        session.invalidate();
    }

    public SessionHotel requireHotel(HttpSession session) {
        String role = requireRole(session);
        if (!"hotel".equals(role)) {
            log.warn("Hotel session required but role={} was present", role);
            throw new IllegalArgumentException("Hotel login is required");
        }
        Integer hotelId = (Integer) session.getAttribute(SESSION_HOTEL_ID);
        String displayName = (String) session.getAttribute(SESSION_DISPLAY_NAME);
        log.debug("Hotel session verified hotelId={} hotelName={}", hotelId, displayName);
        return new SessionHotel(hotelId, displayName);
    }

    public void requireAdmin(HttpSession session) {
        String role = requireRole(session);
        if (!"admin".equals(role)) {
            log.warn("Admin session required but role={} was present", role);
            throw new IllegalArgumentException("Admin login is required");
        }
        log.debug("Admin session verified");
    }

    public void assertCanViewHotel(HttpSession session, Integer hotelId) {
        String role = requireRole(session);
        if ("admin".equals(role)) {
            log.debug("Admin access granted for hotel dashboard hotelId={}", hotelId);
            return;
        }
        if (!"hotel".equals(role)) {
            log.warn("Dashboard access denied for unauthenticated role={} hotelId={}", role, hotelId);
            throw new IllegalArgumentException("Login is required");
        }
        Integer sessionHotelId = (Integer) session.getAttribute(SESSION_HOTEL_ID);
        if (!hotelId.equals(sessionHotelId)) {
            log.warn("Dashboard access denied requestedHotelId={} sessionHotelId={}", hotelId, sessionHotelId);
            throw new IllegalArgumentException("You can only view your own hotel dashboard");
        }
        log.debug("Hotel dashboard access granted hotelId={}", hotelId);
    }

    private String requireRole(HttpSession session) {
        String role = (String) session.getAttribute(SESSION_ROLE);
        if (role == null) {
            log.warn("Role required but session was unauthenticated");
            throw new IllegalArgumentException("Login is required");
        }
        return role;
    }

    public record SessionHotel(Integer hotelId, String hotelName) {
    }
}
