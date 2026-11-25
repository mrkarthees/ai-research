DROP PROCEDURE IF EXISTS GetUsersList;

DELIMITER $$

CREATE PROCEDURE GetUsersList(
    IN p_search_text VARCHAR(255),
    IN p_offset_start BIGINT,
    IN p_rows_per_page BIGINT
)
BEGIN

    DECLARE startRowIndex BIGINT DEFAULT 0;

    SET startRowIndex = (p_offset_start - 1) * p_rows_per_page;

    SELECT
        u.id AS id,
        u.name AS name,
        u.email AS email,
        u.age AS age,
        u.username AS username,
        u.phone_number AS phone_number,
        u.active AS active,
        u.created AS created,
        u.created_by AS created_by,
        u.modified AS modified,
        u.modified_by AS modified_by,
        COUNT(*) OVER() AS totalRowsCount

    FROM users u

    WHERE u.active = 1
    AND (
        p_search_text IS NULL
        OR p_search_text = ''
        OR u.name LIKE CONCAT('%', p_search_text, '%')
        OR u.email LIKE CONCAT('%', p_search_text, '%')
        OR u.username LIKE CONCAT('%', p_search_text, '%')
    )

    ORDER BY u.created DESC

    LIMIT startRowIndex, p_rows_per_page;

END $$

DELIMITER ;
