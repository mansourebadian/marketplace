IF COL_LENGTH(N'dbo.Business', N'serviceLocation') IS NULL
    EXEC(N'ALTER TABLE [dbo].[Business] ADD [serviceLocation] NVARCHAR(32)');
