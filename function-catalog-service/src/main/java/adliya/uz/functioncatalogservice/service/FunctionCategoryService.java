package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.dto.FunctionCategoryRequest;
import adliya.uz.functioncatalogservice.entity.*;
import adliya.uz.functioncatalogservice.exception.WorkflowConflictException;
import adliya.uz.functioncatalogservice.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.*;

@Service @RequiredArgsConstructor
public class FunctionCategoryService {
    private final FunctionCategoryRepository repository;
    private final OrgFunctionRepository functions;
    private final AuditWriter audit;

    public List<FunctionCategory> getAll() { return repository.findAll(); }
    public FunctionCategory get(Long id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("Category not found: " + id));
    }

    public FunctionCategory resolve(Long id, String legacyName) {
        if (id != null) {
            var category = get(id);
            if (legacyName != null && !legacyName.isBlank() && !legacyName.equals(category.getName())) {
                throw new IllegalArgumentException("category and categoryId refer to different categories");
            }
            return category;
        }
        if (legacyName == null || legacyName.isBlank()) return null;
        return repository.findByName(legacyName).orElseThrow(
                () -> new IllegalArgumentException("Unknown category; create it with FUNCTION_CATEGORIES_MANAGE first"));
    }

    @Transactional
    public FunctionCategory create(FunctionCategoryRequest request) {
        checkUnique(request.name(), null);
        var category = FunctionCategory.builder().name(request.name()).nameTranslations(translations(request.nameTranslations())).build();
        repository.saveAndFlush(category);
        audit.category(category.getId(), AuditAction.CREATE, "Category created: " + category.getName());
        return category;
    }

    @Transactional
    public FunctionCategory update(Long id, FunctionCategoryRequest request) {
        var category = get(id);
        checkUnique(request.name(), id);
        String old = category.getName();
        category.setName(request.name());
        if (request.nameTranslations() != null) category.setNameTranslations(translations(request.nameTranslations()));
        else if (!old.equals(request.name())) {
            category.getNameTranslations().entrySet().removeIf(e -> TranslatedText.MACHINE.equals(e.getValue().source()));
        }
        repository.saveAndFlush(category);
        audit.category(id, AuditAction.UPDATE, "Category updated: " + old + " -> " + category.getName());
        return category;
    }

    @Transactional
    public void delete(Long id) {
        var category = get(id);
        if (functions.existsByFunctionCategory_Id(id)) throw new WorkflowConflictException("Category is referenced by a function");
        audit.category(id, AuditAction.DELETE, "Category deleted: " + category.getName());
        repository.delete(category);
        repository.flush(); // FK also protects concurrent assignment.
    }

    private void checkUnique(String name, Long exceptId) {
        repository.findByName(name).filter(c -> !Objects.equals(c.getId(), exceptId)).ifPresent(c -> {
            throw new WorkflowConflictException("Category name already exists");
        });
    }

    private Map<String, TranslatedText> translations(Map<String, String> values) {
        Map<String, TranslatedText> result = new LinkedHashMap<>();
        if (values != null) values.forEach((code, text) -> result.put(code, new TranslatedText(text, TranslatedText.HUMAN)));
        return result;
    }
}
