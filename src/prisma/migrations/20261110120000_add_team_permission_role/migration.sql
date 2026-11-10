ALTER TABLE [dbo].[BusinessTeamMember]
ADD [permissionRole] NVARCHAR(16) NOT NULL CONSTRAINT [BusinessTeamMember_permissionRole_df] DEFAULT 'none';
