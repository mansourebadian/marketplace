ALTER TABLE [dbo].[BusinessService]
ADD [variants] NVARCHAR(MAX) NOT NULL CONSTRAINT [BusinessService_variants_df] DEFAULT N'[]';
