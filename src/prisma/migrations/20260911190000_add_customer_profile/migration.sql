BEGIN TRY

BEGIN TRAN;

-- Extend the Auth.js user row with editable customer profile fields.
ALTER TABLE [dbo].[User] ADD
    [firstName] NVARCHAR(100),
    [lastName] NVARCHAR(100),
    [dateOfBirth] DATE,
    [gender] NVARCHAR(32),
    [updatedAt] DATETIME2 NOT NULL CONSTRAINT [User_updatedAt_df] DEFAULT CURRENT_TIMESTAMP;

-- Preserve existing Google/legacy names by splitting on the first space.
EXEC sp_executesql N'
UPDATE [dbo].[User]
SET
    [firstName] = LEFT(
        CASE
            WHEN CHARINDEX(N'' '', LTRIM(RTRIM([name]))) > 0
                THEN LEFT(LTRIM(RTRIM([name])), CHARINDEX(N'' '', LTRIM(RTRIM([name]))) - 1)
            ELSE LTRIM(RTRIM([name]))
        END,
        100
    ),
    [lastName] = LEFT(
        CASE
            WHEN CHARINDEX(N'' '', LTRIM(RTRIM([name]))) > 0
                THEN LTRIM(SUBSTRING(
                    LTRIM(RTRIM([name])),
                    CHARINDEX(N'' '', LTRIM(RTRIM([name]))) + 1,
                    LEN(LTRIM(RTRIM([name])))
                ))
            ELSE NULL
        END,
        100
    )
WHERE [name] IS NOT NULL
  AND LTRIM(RTRIM([name])) <> N''''
  AND [firstName] IS NULL;
';

-- Prisma supplies @updatedAt values on writes; the temporary default only
-- exists so current rows can receive a value while the column is introduced.
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_updatedAt_df];

CREATE TABLE [dbo].[CustomerAddress] (
    [id] NVARCHAR(36) NOT NULL,
    [label] NVARCHAR(16) NOT NULL,
    [addressLine] NVARCHAR(300) NOT NULL,
    [city] NVARCHAR(100),
    [province] NVARCHAR(100),
    [postalCode] NVARCHAR(20),
    [userId] NVARCHAR(1000) NOT NULL,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [CustomerAddress_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [updatedAt] DATETIME2 NOT NULL,
    CONSTRAINT [CustomerAddress_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [CustomerAddress_userId_label_key] UNIQUE NONCLUSTERED ([userId], [label])
);

ALTER TABLE [dbo].[CustomerAddress] ADD CONSTRAINT [CustomerAddress_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id])
    ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW;

END CATCH
