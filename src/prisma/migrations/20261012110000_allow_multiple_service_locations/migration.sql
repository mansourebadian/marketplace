IF EXISTS (SELECT 1 FROM sys.check_constraints WHERE name = N'Business_serviceLocation_check')
    ALTER TABLE [dbo].[Business] DROP CONSTRAINT [Business_serviceLocation_check];
