CREATE TABLE [dbo].[PhoneChallenge] (
    [id] NVARCHAR(64) NOT NULL,
    [phone] NVARCHAR(32) NOT NULL,
    [codeHash] NVARCHAR(64) NOT NULL,
    [requestKey] NVARCHAR(64) NOT NULL,
    [flow] NVARCHAR(16) NOT NULL,
    [callbackUrl] NVARCHAR(2048) NOT NULL,
    [attempts] INT NOT NULL CONSTRAINT [PhoneChallenge_attempts_df] DEFAULT 0,
    [delivered] BIT NOT NULL CONSTRAINT [PhoneChallenge_delivered_df] DEFAULT 0,
    [consumedAt] DATETIME2,
    [createdAt] DATETIME2 NOT NULL CONSTRAINT [PhoneChallenge_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
    [expiresAt] DATETIME2 NOT NULL,
    CONSTRAINT [PhoneChallenge_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE NONCLUSTERED INDEX [PhoneChallenge_phone_createdAt_idx] ON [dbo].[PhoneChallenge]([phone], [createdAt]);
CREATE NONCLUSTERED INDEX [PhoneChallenge_requestKey_createdAt_idx] ON [dbo].[PhoneChallenge]([requestKey], [createdAt]);
