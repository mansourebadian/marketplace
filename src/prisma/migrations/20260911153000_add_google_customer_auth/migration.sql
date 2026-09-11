BEGIN TRY

BEGIN TRAN;

-- A Google profile does not include a phone number. Keep phone uniqueness for
-- real phone values while allowing any number of Google users with NULL phone.
ALTER TABLE [dbo].[User] DROP CONSTRAINT [User_phone_key];

IF EXISTS (
    SELECT 1
    FROM [dbo].[User]
    WHERE LEN([phone]) > 32
)
BEGIN
    THROW 50001, 'User.phone contains a value longer than 32 characters.', 1;
END;

ALTER TABLE [dbo].[User] ALTER COLUMN [phone] NVARCHAR(32) NULL;

-- Auth.js user profile fields.
ALTER TABLE [dbo].[User] ADD
    [email] NVARCHAR(320),
    [emailVerified] DATETIME2,
    [image] NVARCHAR(2048);

-- SQL Server compiles column references for a batch before executing the ALTER
-- above. Compile these statements after the new columns exist.
EXEC sp_executesql N'
UPDATE [dbo].[User]
SET [email] = CONCAT(
    N''legacy+'',
    LOWER(CONVERT(VARCHAR(64), HASHBYTES(''SHA2_256'', [id]), 2)),
    N''@invalid.local''
)
WHERE [email] IS NULL;

ALTER TABLE [dbo].[User] ALTER COLUMN [email] NVARCHAR(320) NOT NULL;

ALTER TABLE [dbo].[User] ADD CONSTRAINT [User_email_key]
    UNIQUE NONCLUSTERED ([email]);
';

CREATE UNIQUE NONCLUSTERED INDEX [User_phone_key]
    ON [dbo].[User]([phone])
    WHERE [phone] IS NOT NULL;

-- OAuth accounts persisted by the Prisma adapter.
CREATE TABLE [dbo].[Account] (
    [id] NVARCHAR(36) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [type] NVARCHAR(32) NOT NULL,
    [provider] NVARCHAR(64) NOT NULL,
    [providerAccountId] NVARCHAR(255) NOT NULL,
    [refresh_token] NVARCHAR(MAX),
    [access_token] NVARCHAR(MAX),
    [expires_at] INT,
    [token_type] NVARCHAR(64),
    [scope] NVARCHAR(MAX),
    [id_token] NVARCHAR(MAX),
    [session_state] NVARCHAR(255),
    CONSTRAINT [Account_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Account_provider_providerAccountId_key]
        UNIQUE NONCLUSTERED ([provider], [providerAccountId])
);

CREATE NONCLUSTERED INDEX [Account_userId_idx]
    ON [dbo].[Account]([userId]);

-- Database-backed customer sessions.
CREATE TABLE [dbo].[Session] (
    [id] NVARCHAR(36) NOT NULL,
    [sessionToken] NVARCHAR(255) NOT NULL,
    [userId] NVARCHAR(1000) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [Session_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [Session_sessionToken_key]
        UNIQUE NONCLUSTERED ([sessionToken])
);

CREATE NONCLUSTERED INDEX [Session_userId_idx]
    ON [dbo].[Session]([userId]);

CREATE TABLE [dbo].[VerificationToken] (
    [identifier] NVARCHAR(320) NOT NULL,
    [token] NVARCHAR(255) NOT NULL,
    [expires] DATETIME2 NOT NULL,
    CONSTRAINT [VerificationToken_token_key]
        UNIQUE NONCLUSTERED ([token]),
    CONSTRAINT [VerificationToken_identifier_token_key]
        UNIQUE NONCLUSTERED ([identifier], [token])
);

ALTER TABLE [dbo].[Account] ADD CONSTRAINT [Account_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id])
    ON DELETE CASCADE ON UPDATE NO ACTION;

ALTER TABLE [dbo].[Session] ADD CONSTRAINT [Session_userId_fkey]
    FOREIGN KEY ([userId]) REFERENCES [dbo].[User]([id])
    ON DELETE CASCADE ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
