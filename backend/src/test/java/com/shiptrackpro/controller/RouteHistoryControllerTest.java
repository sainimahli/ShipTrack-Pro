package com.shiptrackpro.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.shiptrackpro.entity.RouteHistory;
import com.shiptrackpro.security.CustomUserDetailsService;
import com.shiptrackpro.security.JwtAuthenticationFilter;
import com.shiptrackpro.security.JwtService;
import com.shiptrackpro.security.OAuth2SuccessHandler;
import com.shiptrackpro.security.PasswordConfig;
import com.shiptrackpro.security.RestAuthenticationEntryPoint;
import com.shiptrackpro.security.SecurityConfig;
import com.shiptrackpro.service.RouteHistoryService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Arrays;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RouteHistoryController.class)
@Import({SecurityConfig.class, PasswordConfig.class, JwtAuthenticationFilter.class})
@SuppressWarnings("null")
public class RouteHistoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private RouteHistoryService routeHistoryService;

    @MockitoBean
    private CustomUserDetailsService customUserDetailsService;

    @MockitoBean
    private OAuth2SuccessHandler oAuth2SuccessHandler;

    @MockitoBean
    private RestAuthenticationEntryPoint restAuthenticationEntryPoint;

    @MockitoBean
    private JwtService jwtService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @WithMockUser(roles = "LOGISTICS_OPERATOR")
    public void testSaveRouteHistory_Authorized() throws Exception {
        RouteHistory history = RouteHistory.builder()
                .shipmentId("SHP001")
                .latitude(13.0827)
                .longitude(80.2707)
                .locationName("Chennai")
                .status("IN_TRANSIT")
                .timestamp(LocalDateTime.of(2026, 7, 30, 10, 0))
                .build();

        when(routeHistoryService.saveRouteHistory(any(RouteHistory.class))).thenReturn(history);

        mockMvc.perform(post("/api/route-history")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(history)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.shipmentId").value("SHP001"))
                .andExpect(jsonPath("$.locationName").value("Chennai"));
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    public void testSaveRouteHistory_UnauthorizedRole() throws Exception {
        RouteHistory history = RouteHistory.builder()
                .shipmentId("SHP001")
                .latitude(13.0827)
                .longitude(80.2707)
                .locationName("Chennai")
                .status("IN_TRANSIT")
                .build();

        mockMvc.perform(post("/api/route-history")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(history)))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "CUSTOMER")
    public void testGetRouteHistory() throws Exception {
        RouteHistory history1 = RouteHistory.builder()
                .id(1L)
                .shipmentId("SHP001")
                .latitude(13.0827)
                .longitude(80.2707)
                .locationName("Chennai")
                .status("IN_TRANSIT")
                .timestamp(LocalDateTime.of(2026, 7, 30, 10, 0))
                .build();

        RouteHistory history2 = RouteHistory.builder()
                .id(2L)
                .shipmentId("SHP001")
                .latitude(12.9716)
                .longitude(77.5946)
                .locationName("Bengaluru")
                .status("DELIVERED")
                .timestamp(LocalDateTime.of(2026, 7, 30, 14, 0))
                .build();

        when(routeHistoryService.getRouteHistoryByShipmentId("SHP001"))
                .thenReturn(Arrays.asList(history1, history2));

        mockMvc.perform(get("/api/route-history/SHP001"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].locationName").value("Chennai"))
                .andExpect(jsonPath("$[1].locationName").value("Bengaluru"));
    }

    @Test
    @WithMockUser(roles = "ADMINISTRATOR")
    public void testDeleteRouteHistory_Authorized() throws Exception {
        doNothing().when(routeHistoryService).deleteRouteHistory(1L);

        mockMvc.perform(delete("/api/route-history/1")
                        .with(csrf()))
                .andExpect(status().isNoContent());

        verify(routeHistoryService).deleteRouteHistory(1L);
    }

    @Test
    @WithMockUser(roles = "LOGISTICS_OPERATOR")
    public void testDeleteRouteHistory_Unauthorized() throws Exception {
        mockMvc.perform(delete("/api/route-history/1")
                        .with(csrf()))
                .andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "LOGISTICS_OPERATOR")
    public void testSaveRouteHistory_InvalidPayload() throws Exception {
        RouteHistory invalidHistory = RouteHistory.builder()
                .shipmentId("")
                .latitude(null)
                .longitude(80.2707)
                .locationName("Chennai")
                .status("")
                .build();

        mockMvc.perform(post("/api/route-history")
                        .with(csrf())
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(invalidHistory)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.shipmentId").value("Shipment ID is required"))
                .andExpect(jsonPath("$.latitude").value("Latitude is required"))
                .andExpect(jsonPath("$.status").value("Status is required"));
    }
}
