package adliya.uz.task1.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "permissions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Permission {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    //"ORGANIZATIONS_CREATE" — used directly as a Spring Security authority
    @Column(nullable = false, unique = true, length = 60)
    private String code;

    //  "Create organizations" — for display in the admin UI
    @Column(nullable = false, length = 150)
    private String name;

    //  "Organization Management" — for grouping in the UI, like Image 1
    @Column(length = 60)
    private String category;
}