package com.synap.note;

import com.synap.note.dto.NoteRequest;
import com.synap.note.dto.NoteResponse;
import com.synap.note.dto.NoteSummary;
import com.synap.note.dto.RelatedNote;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
public class NoteController {

    private final NoteService noteService;

    public NoteController(NoteService noteService) {
        this.noteService = noteService;
    }

    @GetMapping
    public List<NoteSummary> list() {
        return noteService.list();
    }

    @GetMapping("/{id}")
    public NoteResponse get(@PathVariable long id) {
        return noteService.get(id);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public NoteResponse create(@Valid @RequestBody NoteRequest request) {
        return noteService.create(request);
    }

    @PutMapping("/{id}")
    public NoteResponse update(@PathVariable long id, @Valid @RequestBody NoteRequest request) {
        return noteService.update(id, request);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        noteService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/related")
    public List<RelatedNote> related(@PathVariable long id) {
        return noteService.related(id);
    }

    @PostMapping("/{id}/save")
    @ResponseStatus(HttpStatus.CREATED)
    public NoteResponse saveCopy(@PathVariable long id) {
        return noteService.saveCopy(id);
    }

    // ---- 수동 링크 ----

    @GetMapping("/{id}/links")
    public List<NoteService.LinkDto> links(@PathVariable long id) {
        return noteService.listLinks(id);
    }

    @PostMapping("/{id}/links/{targetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void addLink(@PathVariable long id, @PathVariable long targetId) {
        noteService.addLink(id, targetId);
    }

    @DeleteMapping("/{id}/links/{targetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void removeLink(@PathVariable long id, @PathVariable long targetId) {
        noteService.removeLink(id, targetId);
    }
}
