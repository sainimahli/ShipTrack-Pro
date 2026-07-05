package com.shiptrackpro.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Response returned after successful registration or login, carrying the
 * JWT the client should attach to subsequent requests.
 */
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;

    /** Convenience field so clients don't have to decode the JWT client-side. */
    private String email;

    /** Convenience field so clients know the token's expected prefix/type. */
    @Builder.Default
    private String tokenType = "Bearer";

}
