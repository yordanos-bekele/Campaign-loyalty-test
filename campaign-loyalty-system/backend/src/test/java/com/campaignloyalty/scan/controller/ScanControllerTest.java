package com.campaignloyalty.scan.controller;

import com.campaignloyalty.common.exception.GlobalExceptionHandler;
import com.campaignloyalty.scan.service.ScanService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.Mockito.verifyNoInteractions;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(ScanController.class)
@Import(GlobalExceptionHandler.class)
class ScanControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private ScanService scanService;

    @Test
    void rejectsBlankTokenRequest() throws Exception {
        mockMvc.perform(post("/api/scan")
                        .cookie(new jakarta.servlet.http.Cookie("device_id", "device-1"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("token is required"));

        verifyNoInteractions(scanService);
    }

    @Test
    void rejectsMissingDeviceCookie() throws Exception {
        mockMvc.perform(post("/api/scan")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"token\":\"abc\"}"))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("device_id cookie is required"));

        verifyNoInteractions(scanService);
    }
}
