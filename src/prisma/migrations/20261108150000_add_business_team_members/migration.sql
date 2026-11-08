CREATE TABLE [dbo].[BusinessTeamMember] (
  [id] NVARCHAR(36) NOT NULL,
  [businessId] NVARCHAR(36) NOT NULL,
  [firstName] NVARCHAR(100) NOT NULL,
  [lastName] NVARCHAR(100),
  [email] NVARCHAR(320) NOT NULL,
  [phone] NVARCHAR(32),
  [additionalPhone] NVARCHAR(32),
  [country] NVARCHAR(100),
  [birthday] DATE,
  [gender] NVARCHAR(64),
  [pronouns] NVARCHAR(64),
  [color] NVARCHAR(16) NOT NULL,
  [jobTitle] NVARCHAR(255),
  [startDate] DATE,
  [endDate] DATE,
  [employmentType] NVARCHAR(64),
  [externalId] NVARCHAR(100),
  [notes] NVARCHAR(1000),
  [imageName] NVARCHAR(100),
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [BusinessTeamMember_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  [updatedAt] DATETIME2 NOT NULL,
  CONSTRAINT [BusinessTeamMember_pkey] PRIMARY KEY CLUSTERED ([id])
);
CREATE NONCLUSTERED INDEX [BusinessTeamMember_businessId_idx] ON [dbo].[BusinessTeamMember]([businessId]);
ALTER TABLE [dbo].[BusinessTeamMember] ADD CONSTRAINT [BusinessTeamMember_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE CASCADE ON UPDATE NO ACTION;
