package com.synap.comment;

import com.synap.auth.CurrentUser;
import com.synap.comment.dto.CommentDtos.CommentDto;
import com.synap.comment.dto.CommentDtos.CommentRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api")
public class CommentController {

    private final CommentService commentService;

    public CommentController(CommentService commentService) {
        this.commentService = commentService;
    }

    @GetMapping("/notes/{id}/comments")
    public List<CommentDto> list(@PathVariable long id) {
        return commentService.list(CurrentUser.id(), id);
    }

    @PostMapping("/notes/{id}/comments")
    @ResponseStatus(HttpStatus.CREATED)
    public CommentDto add(@PathVariable long id, @Valid @RequestBody CommentRequest req) {
        return commentService.add(CurrentUser.id(), id, req.body());
    }

    @DeleteMapping("/comments/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable long id) {
        commentService.delete(CurrentUser.id(), id);
    }
}
