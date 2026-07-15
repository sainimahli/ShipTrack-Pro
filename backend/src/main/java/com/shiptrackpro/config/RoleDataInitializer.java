package com.shiptrackpro.config;

import com.shiptrackpro.entity.Role;
import com.shiptrackpro.repository.RoleRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class RoleDataInitializer implements CommandLineRunner {

    private final RoleRepository roleRepository;

    public RoleDataInitializer(RoleRepository roleRepository) {
        this.roleRepository = roleRepository;
    }

    @Override
    public void run(String... args) {
        Map<String, String> defaultRoles = new LinkedHashMap<>();
        defaultRoles.put("CUSTOMER", "Individual customer who books and tracks shipments");
        defaultRoles.put("BUSINESS_CLIENT", "Business account holder with company shipment needs");
        defaultRoles.put("LOGISTICS_OPERATOR", "Staff managing warehouse and shipment operations");
        defaultRoles.put("SUPPORT_AGENT", "Customer support staff handling queries and issues");
        defaultRoles.put("ADMINISTRATOR", "Full system access and management");
        defaultRoles.put("SUPER_ADMIN", "Highest-level system owner with unrestricted administration access");

        defaultRoles.forEach((roleName, description) ->
                roleRepository.findByRoleName(roleName).orElseGet(() -> {
                    Role role = new Role();
                    role.setRoleName(roleName);
                    role.setDescription(description);
                    return roleRepository.save(role);
                }));
    }
}
