ALTER TABLE [dbo].[BusinessService]
ADD [extraTimes] NVARCHAR(MAX) NOT NULL CONSTRAINT [BusinessService_extraTimes_df] DEFAULT N'[]';
