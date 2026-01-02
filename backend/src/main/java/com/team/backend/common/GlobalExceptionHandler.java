package com.team.backend.common.error;

import com.team.backend.config.AiUpstreamException;
import org.springframework.http.ResponseEntity;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({
            IllegalArgumentException.class,
            MethodArgumentNotValidException.class,
            HttpMessageNotReadableException.class
    })
    public ResponseEntity<?> badRequest(Exception e) {
        return ResponseEntity.badRequest().body(Map.of(
                "code", "BAD_REQUEST",
                "message", e.getMessage() == null ? "bad request" : e.getMessage()
        ));
    }

    @ExceptionHandler(AiUpstreamException.class)
    public ResponseEntity<?> aiUpstream(AiUpstreamException e) {
        return ResponseEntity.status(e.getStatus()).body(Map.of(
                "code", e.getCode(),
                "message", e.getMessage()
        ));
    }
}