package com.synap.note;

public class NoteNotFoundException extends RuntimeException {
    public NoteNotFoundException(long id) {
        super("Note not found: " + id);
    }
}
