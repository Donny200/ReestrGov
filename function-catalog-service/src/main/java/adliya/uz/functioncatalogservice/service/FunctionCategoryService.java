package adliya.uz.functioncatalogservice.service;

import adliya.uz.functioncatalogservice.dto.FunctionCategoryRequest;
import adliya.uz.functioncatalogservice.entity.AuditAction;
import adliya.uz.functioncatalogservice.entity.FunctionCategory;
import adliya.uz.functioncatalogservice.entity.TranslatedText;
import adliya.uz.functioncatalogservice.exception.WorkflowConflictException;
import adliya.uz.functioncatalogservice.repository.FunctionCategoryRepository;
import adliya.uz.functioncatalogservice.repository.OrgFunctionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.util.List;
import java.util.NoSuchElementException;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class FunctionCategoryService {

    private final FunctionCategoryRepository repository;
    private final OrgFunctionRepository functions;
    private final AuditWriter audit;

    public List<FunctionCategory> getAll() {
        return repository.findAll();
    }

    public FunctionCategory get(Long id) {
        return repository.findById(id).orElseThrow(() -> new NoSuchElementException("Category not found: " + id));
    }

    public FunctionCategory resolve(Long id, String legacyName) {
        if (id != null) {
            FunctionCategory category = get(id);
            if (StringUtils.hasText(legacyName) && !legacyName.equals(category.getName())) {
                throw new IllegalArgumentException("category and categoryId refer to different categories");
            }
            return category;
        }
        if (!StringUtils.hasText(legacyName)) {
            return null;
        }
        return repository.findByName(legacyName).orElseThrow(
                () -> new IllegalArgumentException("Unknown category; create it with FUNCTION_CATEGORIES_MANAGE first"));
    }

    @Transactional
    public FunctionCategory create(FunctionCategoryRequest request) {
        checkUnique(request.name(), null);
        FunctionCategory category = FunctionCategory.builder()
                .name(request.name())
                .nameTranslations(TranslatedText.humanEdits(request.nameTranslations()))
                .build();
        repository.saveAndFlush(category);
        audit.category(category.getId(), AuditAction.CREATE, "Category created: " + category.getName());
        return category;
    }

    @Transactional
    public FunctionCategory update(Long id, FunctionCategoryRequest request) {
        FunctionCategory category = get(id);
        checkUnique(request.name(), id);
        String previousName = category.getName();
        category.setName(request.name());
        if (request.nameTranslations() != null) {
            category.setNameTranslations(TranslatedText.humanEdits(request.nameTranslations()));
        } else if (!previousName.equals(request.name())) {
            category.getNameTranslations().entrySet().removeIf(entry ->
                    entry.getValue() != null && TranslatedText.MACHINE.equals(entry.getValue().source()));
        }
        repository.saveAndFlush(category);
        audit.category(id, AuditAction.UPDATE, "Category updated: " + previousName + " -> " + category.getName());
        return category;
    }

    @Transactional
    public void delete(Long id) {
        FunctionCategory category = get(id);
        if (functions.existsByFunctionCategory_Id(id)) {
            throw new WorkflowConflictException("Category is referenced by a function");
        }
        audit.category(id, AuditAction.DELETE, "Category deleted: " + category.getName());
        repository.delete(category);
        repository.flush();
    }

    private void checkUnique(String name, Long exceptId) {
        repository.findByName(name)
                .filter(existing -> !Objects.equals(existing.getId(), exceptId))
                .ifPresent(existing -> {
                    throw new WorkflowConflictException("Category name already exists");
                });
    }
}
