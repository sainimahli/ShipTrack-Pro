package com.shiptrackpro.dto;

/**
 * Returned by the login and OAuth2 success flows.
 *
 * MODIFIED: Added userId, firstName, lastName, email so the React frontend
 * can display the authenticated user's real name without a separate profile
 * call, and so the UI can persist identity across page refreshes.
 */
public class AuthResponse {

    private String token;
    private String role;
    private String message;

    // --- new identity fields ---
    private Long   userId;
    private String firstName;
    private String lastName;
    private String email;

    public AuthResponse() {}

    /** Original 3-arg constructor kept for backward compatibility. */
    public AuthResponse(String token, String role, String message) {
        this.token   = token;
        this.role    = role;
        this.message = message;
    }

    /** Full constructor used by the updated login flow. */
    public AuthResponse(String token, String role, String message,
                        Long userId, String firstName, String lastName, String email) {
        this.token     = token;
        this.role      = role;
        this.message   = message;
        this.userId    = userId;
        this.firstName = firstName;
        this.lastName  = lastName;
        this.email     = email;
    }

    // ---- getters / setters ----

    public String getToken()               { return token; }
    public void   setToken(String token)   { this.token = token; }

    public String getRole()                { return role; }
    public void   setRole(String role)     { this.role = role; }

    public String getMessage()             { return message; }
    public void   setMessage(String msg)   { this.message = msg; }

    public Long   getUserId()              { return userId; }
    public void   setUserId(Long id)       { this.userId = id; }

    public String getFirstName()           { return firstName; }
    public void   setFirstName(String fn)  { this.firstName = fn; }

    public String getLastName()            { return lastName; }
    public void   setLastName(String ln)   { this.lastName = ln; }

    public String getEmail()               { return email; }
    public void   setEmail(String email)   { this.email = email; }
}