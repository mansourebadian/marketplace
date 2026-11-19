CREATE TABLE [dbo].[BusinessClient] (
  [id] NVARCHAR(36) NOT NULL,
  [businessId] NVARCHAR(36) NOT NULL,
  [firstName] NVARCHAR(100) NOT NULL,
  [lastName] NVARCHAR(100),
  [email] NVARCHAR(320),
  [phone] NVARCHAR(32),
  [birthday] DATE,
  [gender] NVARCHAR(32),
  [details] NVARCHAR(MAX) NOT NULL,
  [photo] VARBINARY(MAX),
  [photoType] NVARCHAR(32),
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [BusinessClient_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [BusinessClient_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE INDEX [BusinessClient_businessId_idx] ON [dbo].[BusinessClient]([businessId]);
