package com.shiptrackpro.config;

import com.shiptrackpro.entity.BusinessClient;
import com.shiptrackpro.entity.RegistrationStatus;
import com.shiptrackpro.entity.Role;
import com.shiptrackpro.entity.User;
import com.shiptrackpro.repository.BusinessClientRepository;
import com.shiptrackpro.repository.RoleRepository;
import com.shiptrackpro.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.Optional;

@Component
@Order(2)
public class UserDataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final BusinessClientRepository businessClientRepository;

    public UserDataInitializer(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder, BusinessClientRepository businessClientRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.businessClientRepository = businessClientRepository;
    }

    @Override
    public void run(String... args) {
        // Seed Admin User (admin@shiptrack.com)
        seedUser("Admin", "User", "admin@shiptrack.com", "admin123", "ADMINISTRATOR", "9876543215");

        // Seed Admin User (admin@shiptrackpro.com)
        seedUser("Admin", "User Pro", "admin@shiptrackpro.com", "admin123", "ADMINISTRATOR", "9876543214");

        // Seed Operator User
        seedUser("Operator", "User", "operator@shiptrack.com", "operator123", "LOGISTICS_OPERATOR", "9876543211");

        // Seed Customer User
        seedUser("Customer", "User", "customer@shiptrack.com", "customer123", "CUSTOMER", "9876543210");

        // Seed Business Client User
        seedBusinessClient("Anita", "Rao", "business@shiptrack.com", "business123", "BUSINESS_CLIENT", "9876543219", "Rao Enterprises Pvt Ltd", "Retail", "https://raoenterprises.example.com", "09ABCDE1234F1Z5");

        // Seed Support User
        seedUser("Support", "User", "support@shiptrack.com", "support123", "SUPPORT_AGENT", "9876543212");

        // Dynamically approve the user's specific registered email if it exists
        userRepository.findByEmail("balajikrishnapillai01@gmail.com").ifPresent(user -> {
            if (user.getRegistrationStatus() != RegistrationStatus.APPROVED) {
                user.setRegistrationStatus(RegistrationStatus.APPROVED);
                userRepository.save(user);
                System.out.println("Approved existing user: balajikrishnapillai01@gmail.com");
            }
        });
    }

    private void seedUser(String firstName, String lastName, String email, String password, String roleName, String phone) {
        if (!userRepository.existsByEmail(email)) {
            Optional<Role> roleOpt = roleRepository.findByRoleName(roleName);
            if (roleOpt.isPresent()) {
                User user = new User();
                user.setFirstName(firstName);
                user.setLastName(lastName);
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode(password));
                user.setPhone(phone);
                user.setRole(roleOpt.get());
                user.setRegistrationStatus(RegistrationStatus.APPROVED);
                user.setActive(true);
                userRepository.save(user);
                System.out.println("Seeded user: " + email + " with role: " + roleName);
            } else {
                System.out.println("Role " + roleName + " not found, cannot seed user " + email);
            }
        }
    }

    private void seedBusinessClient(String firstName, String lastName, String email, String password, String roleName, String phone, String companyName, String businessType, String website, String gstNumber) {
        if (!userRepository.existsByEmail(email)) {
            Optional<Role> roleOpt = roleRepository.findByRoleName(roleName);
            if (roleOpt.isPresent()) {
                User user = new User();
                user.setFirstName(firstName);
                user.setLastName(lastName);
                user.setEmail(email);
                user.setPassword(passwordEncoder.encode(password));
                user.setPhone(phone);
                user.setRole(roleOpt.get());
                user.setRegistrationStatus(RegistrationStatus.APPROVED);
                user.setActive(true);
                User savedUser = userRepository.save(user);
                System.out.println("Seeded user: " + email + " with role: " + roleName);

                BusinessClient businessClient = new BusinessClient();
                businessClient.setUser(savedUser);
                businessClient.setCompanyName(companyName);
                businessClient.setBusinessType(businessType);
                businessClient.setWebsite(website);
                businessClient.setGstNumber(gstNumber);
                businessClientRepository.save(businessClient);
                System.out.println("Seeded business client company details for user: " + email);
            } else {
                System.out.println("Role " + roleName + " not found, cannot seed business client user " + email);
            }
        }
    }
}
