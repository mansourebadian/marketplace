CREATE TABLE [dbo].[BusinessClientPhoto] (
  [id] NVARCHAR(36) NOT NULL,
  [businessId] NVARCHAR(36) NOT NULL,
  [customerId] NVARCHAR(1000) NOT NULL,
  [identityKey] NVARCHAR(64) NOT NULL,
  [photo] VARBINARY(MAX) NOT NULL,
  [photoType] NVARCHAR(32) NOT NULL,
  CONSTRAINT [BusinessClientPhoto_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE UNIQUE INDEX [BusinessClientPhoto_identityKey_key] ON [dbo].[BusinessClientPhoto]([identityKey]);
CREATE INDEX [BusinessClientPhoto_businessId_idx] ON [dbo].[BusinessClientPhoto]([businessId]);
