import time
from fastapi import Request
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware
from collections import defaultdict
from typing import Dict, List

class RateLimitMiddleware(BaseHTTPMiddleware):
    """
    In-memory rate limiter using sliding window log algorithm to protect
    sensitive intelligence endpoints from denial of service and brute force.
    """
    def __init__(self, app, limit: int = 100, window_secs: int = 60):
        super().__init__(app)
        self.limit = limit
        self.window_secs = window_secs
        self.requests: Dict[str, List[float]] = defaultdict(list)
        
    async def dispatch(self, request: Request, call_next):
        client_ip = request.client.host if request.client else "unknown"
        current_time = time.time()
        
        # Filter request logs to keep only those within the sliding window
        ip_requests = self.requests[client_ip]
        while ip_requests and ip_requests[0] < current_time - self.window_secs:
            ip_requests.pop(0)
            
        if len(ip_requests) >= self.limit:
            return JSONResponse(
                status_code=429,
                content={"detail": "Tactical Intelligence rate limit exceeded. Please retry in a minute."}
            )
            
        ip_requests.append(current_time)
        self.requests[client_ip] = ip_requests
        
        response = await call_next(request)
        return response

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """
    Appends HTTP security headers to protect against XSS, clickjacking, 
    MIME-sniffing, and enforce SSL/TLS (HTTPS Ready).
    """
    async def dispatch(self, request: Request, call_next):
        response = await call_next(request)
        
        # Enforce HTTP Strict Transport Security (HSTS)
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        
        # Clickjacking defense
        response.headers["X-Frame-Options"] = "DENY"
        
        # MIME-sniffing defense
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Cross-Site Scripting (XSS) defense
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Referrer Policy
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        
        return response
