ALTER TABLE [dbo].[BusinessService]
ADD [priceType] NVARCHAR(16) NOT NULL CONSTRAINT [BusinessService_priceType_df] DEFAULT N'FIXED';

EXEC(N'ALTER TABLE [dbo].[BusinessService] ADD CONSTRAINT [BusinessService_priceType_check] CHECK ([priceType] IN (N''FREE'', N''STARTS_AT'', N''FIXED''))');
