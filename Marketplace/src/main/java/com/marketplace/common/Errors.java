package com.marketplace.common;

import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** Shortcuts for HTTP errors. Spring renders them as RFC 7807 problem+json. */
public final class Errors {
    private Errors() {}

    public static ResponseStatusException notFound(String what) {
        return new ResponseStatusException(HttpStatus.NOT_FOUND, what + " not found");
    }

    public static ResponseStatusException badRequest(String msg) {
        return new ResponseStatusException(HttpStatus.BAD_REQUEST, msg);
    }

    public static ResponseStatusException conflict(String msg) {
        return new ResponseStatusException(HttpStatus.CONFLICT, msg);
    }

    public static ResponseStatusException forbidden(String msg) {
        return new ResponseStatusException(HttpStatus.FORBIDDEN, msg);
    }
}
