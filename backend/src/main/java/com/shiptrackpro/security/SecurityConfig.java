package com.shiptrackpro.security;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.http.HttpMethod;

import jakarta.servlet.http.HttpServletResponse;

@Configuration
public class SecurityConfig {

        @Autowired
        private JwtAuthenticationFilter jwtAuthenticationFilter;

        @Autowired
        private CustomUserDetailsService customUserDetailsService;

        @Autowired
        private OAuth2SuccessHandler oAuth2SuccessHandler;

        @Autowired
        private RestAuthenticationEntryPoint restAuthenticationEntryPoint;

        @Bean
        public PasswordEncoder passwordEncoder() {
                return new BCryptPasswordEncoder();
        }

        @Bean
        public AuthenticationProvider authenticationProvider() {
                DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
                provider.setUserDetailsService(customUserDetailsService);
                provider.setPasswordEncoder(passwordEncoder());
                return provider;
        }

        @Bean
        public AuthenticationManager authenticationManager(
                        AuthenticationConfiguration config) throws Exception {
                return config.getAuthenticationManager();
        }

        @Bean
        public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

                http
                                .csrf(csrf -> csrf.disable())
                                .sessionManagement(session -> session
                                                .sessionCreationPolicy(SessionCreationPolicy.STATELESS))

                                .exceptionHandling(exception -> exception
                                                .defaultAuthenticationEntryPointFor(
                                                                restAuthenticationEntryPoint,
                                                                new org.springframework.security.web.util.matcher.AntPathRequestMatcher(
                                                                                "/api/**")))

                                .authenticationProvider(authenticationProvider())

                                .authorizeHttpRequests(auth -> auth
                                                .requestMatchers(
                                                                "/",
                                                                "/index.html",
                                                                "/api/auth/**",
                                                                "/api/roles/**",
                                                                // "/api/admin/**",
                                                                
                                                                "/oauth2/**",
                                                                "/login/oauth2/**"
                                                        )
                                                .permitAll()
                                                .requestMatchers("/api/admin/**")
                                                .hasAnyRole("ADMINISTRATOR", "SUPER_ADMIN")
                                                .requestMatchers(HttpMethod.POST, "/api/shipments")
                                                .hasAnyRole("CUSTOMER", "BUSINESS_CLIENT", "LOGISTICS_OPERATOR", "ADMINISTRATOR", "SUPER_ADMIN")
                                                .requestMatchers(HttpMethod.PUT, "/api/shipments/**", "/api/tracking/status")
                                                .hasAnyRole("LOGISTICS_OPERATOR", "ADMINISTRATOR", "SUPER_ADMIN")
                                                .requestMatchers(HttpMethod.DELETE, "/api/shipments/**")
                                                .hasAnyRole("ADMINISTRATOR", "SUPER_ADMIN")
                                                .requestMatchers(HttpMethod.POST, "/api/tracking/location")
                                                .hasAnyRole("LOGISTICS_OPERATOR", "ADMINISTRATOR", "SUPER_ADMIN")
                                                .anyRequest().authenticated())

                                .oauth2Login(oauth2 -> oauth2.successHandler(oAuth2SuccessHandler))

                                .addFilterBefore(
                                                jwtAuthenticationFilter,
                                                UsernamePasswordAuthenticationFilter.class);

                return http.build();
        }
}
