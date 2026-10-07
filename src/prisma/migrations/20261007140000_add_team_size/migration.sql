IF COL_LENGTH(N'dbo.Business', N'teamSize') IS NULL
    EXEC(N'ALTER TABLE [dbo].[Business] ADD [teamSize] NVARCHAR(32)');

EXEC(N'ALTER TABLE [dbo].[Business] ADD CONSTRAINT [Business_teamSize_check]
CHECK ([teamSize] IS NULL OR [teamSize] IN (
    ''INDEPENDENT'', ''TWO_TO_FIVE'', ''SIX_TO_TEN'', ''ELEVEN_TO_TWENTY'', ''TWENTY_PLUS''
))');
