CREATE TABLE [dbo].[BusinessMemberServices] (
  [id] NVARCHAR(36) NOT NULL,
  [businessId] NVARCHAR(36) NOT NULL,
  [memberKey] NVARCHAR(36) NOT NULL,
  [serviceIds] NVARCHAR(MAX) NOT NULL,
  CONSTRAINT [BusinessMemberServices_pkey] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [BusinessMemberServices_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE CASCADE ON UPDATE NO ACTION
);
CREATE UNIQUE NONCLUSTERED INDEX [BusinessMemberServices_businessId_memberKey_key] ON [dbo].[BusinessMemberServices]([businessId], [memberKey]);
