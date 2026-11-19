BEGIN TRY
BEGIN TRAN;
CREATE TABLE [dbo].[BusinessSale] (
  [id] NVARCHAR(36) NOT NULL,
  [businessId] NVARCHAR(36) NOT NULL,
  [date] NVARCHAR(10) NOT NULL,
  [kind] NVARCHAR(12) NOT NULL,
  [category] NVARCHAR(32) NOT NULL,
  [paymentType] NVARCHAR(16) NOT NULL,
  [quantity] INT NOT NULL,
  [amount] INT NOT NULL,
  [createdAt] DATETIME2 NOT NULL CONSTRAINT [BusinessSale_createdAt_df] DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT [BusinessSale_pkey] PRIMARY KEY CLUSTERED ([id]),
  CONSTRAINT [BusinessSale_quantity_check] CHECK ([quantity] > 0),
  CONSTRAINT [BusinessSale_amount_check] CHECK ([amount] >= 0),
  CONSTRAINT [BusinessSale_kind_check] CHECK ([kind] IN ('SALE', 'REFUND')),
  CONSTRAINT [BusinessSale_paymentType_check] CHECK ([paymentType] IN ('CASH', 'OTHER', 'GIFT_CARD')),
  CONSTRAINT [BusinessSale_category_check] CHECK ([category] IN ('SERVICE', 'ADD_ON', 'PRODUCT', 'SHIPPING', 'GIFT_CARD', 'PACKAGE', 'MEMBERSHIP', 'LATE_CANCEL', 'NO_SHOW'))
);
CREATE NONCLUSTERED INDEX [BusinessSale_businessId_date_idx] ON [dbo].[BusinessSale]([businessId], [date]);
ALTER TABLE [dbo].[BusinessSale] ADD CONSTRAINT [BusinessSale_businessId_fkey] FOREIGN KEY ([businessId]) REFERENCES [dbo].[Business]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;
COMMIT TRAN;
END TRY
BEGIN CATCH
IF @@TRANCOUNT > 0 ROLLBACK TRAN;
THROW;
END CATCH
