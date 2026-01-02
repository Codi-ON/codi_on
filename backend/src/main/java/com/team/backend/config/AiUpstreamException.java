package com.team.backend.config;

public class AiUpstreamException extends RuntimeException {
    private final String code;
    private final int status;

    public AiUpstreamException(String code, int status, String message) {
        super(message);
        this.code = code;
        this.status = status;
    }
    public String getCode() { return code; }
    public int getStatus() { return status; }
}