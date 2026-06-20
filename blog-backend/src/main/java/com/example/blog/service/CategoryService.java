package com.example.blog.service;

import com.example.blog.dto.CategoryRequest;
import com.example.blog.dto.CategoryResponse;
import com.example.blog.entity.Category;
import com.example.blog.exception.ConflictException;
import com.example.blog.exception.ResourceNotFoundException;
import com.example.blog.repository.CategoryRepository;
import com.example.blog.util.SlugUtil;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class CategoryService {

    private final CategoryRepository repo;

    public CategoryService(CategoryRepository repo) {
        this.repo = repo;
    }

    @Transactional(readOnly = true)
    public List<CategoryResponse> list() {
        return repo.findAll().stream().map(CategoryService::toResponse).toList();
    }

    @Transactional
    public CategoryResponse create(CategoryRequest req) {
        if (repo.existsByName(req.name())) {
            throw new ConflictException("A category with this name already exists");
        }
        Category c = new Category();
        c.setName(req.name());
        c.setDescription(req.description());
        c.setSlug(SlugUtil.uniqueSlug(req.name(), repo::existsBySlug));
        return toResponse(repo.save(c));
    }

    @Transactional
    public CategoryResponse update(Long id, CategoryRequest req) {
        Category c = repo.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Category not found"));
        if (!c.getName().equals(req.name()) && repo.existsByName(req.name())) {
            throw new ConflictException("A category with this name already exists");
        }
        c.setName(req.name());
        c.setDescription(req.description());
        return toResponse(repo.save(c));
    }

    @Transactional
    public void delete(Long id) {
        if (!repo.existsById(id)) {
            throw new ResourceNotFoundException("Category not found");
        }
        repo.deleteById(id);
    }

    private static CategoryResponse toResponse(Category c) {
        return new CategoryResponse(c.getId(), c.getName(), c.getSlug(), c.getDescription());
    }
}
