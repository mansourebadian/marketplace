ALTER TABLE [dbo].[BusinessReservation]
ADD [appointmentStatus] NVARCHAR(24) NOT NULL CONSTRAINT [BusinessReservation_appointmentStatus_df] DEFAULT 'BOOKED';

EXEC sp_executesql N'UPDATE [dbo].[BusinessReservation]
SET [appointmentStatus] = CASE
  WHEN [status] = ''CANCELLED'' THEN ''CANCELLED''
  WHEN [status] = ''NO_SHOW'' THEN ''NO_SHOW''
  WHEN [status] = ''COMPLETED'' THEN ''COMPLETED''
  ELSE ''BOOKED''
END';
