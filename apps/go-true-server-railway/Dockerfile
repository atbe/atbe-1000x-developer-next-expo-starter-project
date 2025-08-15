# Use the official GoTrue image as base
FROM supabase/gotrue:v2.176.1

# Cloudflare Containers require linux/amd64 architecture
# The supabase/gotrue image already supports this

# Set the working directory
WORKDIR /app

# Copy any custom configuration files if needed
# COPY gotrue.env /app/.env

# Expose the default GoTrue port
EXPOSE 9999

# The entrypoint is already set in the base image
# It runs the gotrue binary with the serve command 