package com.shiptrackpro.exception;

/**
 * Thrown when a requested {@code Shipment} (or other resource) cannot be
 * found. Handled centrally by a {@code @RestControllerAdvice} to return a
 * 404 response — add one if your project doesn't already have it.
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }
}
