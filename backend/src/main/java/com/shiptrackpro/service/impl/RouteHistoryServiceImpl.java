package com.shiptrackpro.service.impl;

import com.shiptrackpro.entity.RouteHistory;
import com.shiptrackpro.repository.RouteHistoryRepository;
import com.shiptrackpro.service.RouteHistoryService;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Service implementation for managing route histories.
 */
@Service
public class RouteHistoryServiceImpl implements RouteHistoryService {

    private final RouteHistoryRepository routeHistoryRepository;

    public RouteHistoryServiceImpl(RouteHistoryRepository routeHistoryRepository) {
        this.routeHistoryRepository = routeHistoryRepository;
    }

    @Override
    @Transactional
    public RouteHistory saveRouteHistory(RouteHistory routeHistory) {
        if (routeHistory.getTimestamp() == null) {
            routeHistory.setTimestamp(LocalDateTime.now());
        }
        return routeHistoryRepository.save(routeHistory);
    }

    @Override
    @Transactional(readOnly = true)
    public List<RouteHistory> getRouteHistoryByShipmentId(String shipmentId) {
        return routeHistoryRepository.findByShipmentIdOrderByTimestampAsc(shipmentId);
    }

    @Override
    @Transactional
    public void deleteRouteHistory(Long id) {
        if (id == null || !routeHistoryRepository.existsById(id)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Route history record with ID " + id + " not found");
        }
        routeHistoryRepository.deleteById(id);
    }
}
