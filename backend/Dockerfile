# ─────────────────────────────────────────────────────────────────────────────
# ShipTrack-Pro — Backend Dockerfile
# Multi-stage build: Maven build → slim JRE runtime image
# ─────────────────────────────────────────────────────────────────────────────

# Stage 1: Build
FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
# Download dependencies first (layer cache)
RUN mvn dependency:go-offline -q
COPY src ./src
RUN mvn package -DskipTests -q

# Stage 2: Runtime
FROM eclipse-temurin:21-jre-jammy
WORKDIR /app

# Non-root user for security
RUN addgroup --system shiptrack && adduser --system --ingroup shiptrack shiptrack
USER shiptrack

COPY --from=build /app/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
